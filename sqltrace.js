let hasLoaded = false;
// document.getElementById('loader').visible(true)
// document.getElementById('dataexplore').visible(false);
import highlight from '../js/sql-highlight.js';


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    //Only reply to first incoming event, this is emitted after the background script opens the new tab
    if (message.action != 'sqltrace') return;
    if (hasLoaded) return;
    hasLoaded = true;

    //We parse the raw log output to extract the batch and single statements
    let rawLogOutput = message.data;
    let batchStatements = parseBatchStatements(rawLogOutput);
    let singleStatements = parseSingleStatements(rawLogOutput);

    let dataRows = [];
    //Add batch statements to the dataRows with type batch
    Object.entries(batchStatements).forEach(([key, batch]) => {
        dataRows.push({
            "count": batch.length,
            "query": batch[0].fingerprint.join('\n'),
            "duration": batch.reduce((acc, obj) => { return acc + obj.totalBatchTime }, 0),
            "type": "Batch"
        });
    });

    //Add single statements to the dataRows with type single
    Object.entries(singleStatements).forEach(([key, single]) => {
        dataRows.push({
            "count": single.length,
            "query": single[0].fingerprint,
            "duration": single.reduce((acc, obj) => { return acc + obj.time }, 0),
            "type": "Single"
        });
    });

    setViewData(dataRows);
    // completeLoading();
});


/**
 * Parsing the data can take awhile depending on the size of the return, we show a loader until the data 
 * finishes parsing, fingerprinting and grouping. 
 */
// function completeLoading() {
//     document.getElementById('loader').visible(false)
//     document.getElementById('dataexplore').visible(true);
// }


/**
 * Parses the batch statements from the raw log output, extracting the execution times, SQL statements and comments
 * It then groups them by fingerprint, a fingerprint is the SQL statement with literals, comments and columns selected removed.
 * @param {*} sql Log output from enabling SQL trace in a background script.
 * @returns An object with the batch statements grouped by fingerprint
 */
function parseBatchStatements(sql) {
    let batchStatementRegex = /Time: [\d:.]+ id: [\w\[\].]+ \(connpid=\d+\) for: SET AUTOCOMMIT=0[\s\S]+?END TRANSACTION/gm;
    let batchStatementLineRegex = /Batch Statement: \d+? of \d+? id: [\S ]+? for: (.+)(\/\*.+\*\/)+?/g;
    let timeRegex = /Time: ([\d:.]+)/g;

    //Pull the batch statements out to be handled separately
    let batchStatements = sql.match(batchStatementRegex);
    if (!batchStatements) return {};

    //Each batch statement gets its execution times summed and SQL statements and comments extracted
    let batchArray = batchStatements.map((batch) => {
        //Sum the execution times
        let batchTimes = [];
        let match;
        while ((match = timeRegex.exec(batch)) !== null) {
            batchTimes.push(parseTime(match[1]));
        }
        let totalBatchTime = batchTimes.reduce((acc, time) => {
            return acc + time;
        }, 0);

        //Extract the SQL statements and comments
        let sql = [];
        let comments = [];
        while ((match = batchStatementLineRegex.exec(batch)) !== null) {
            sql.push(match[1]);
            comments.push(match[2]);
        }

        return {
            totalBatchTime,
            sql,
            comments
        }
    });

    //After parsing the batch statements, we fingerprint the SQL to better group them by
    //Fingerprinted SQL doesn't contain literals, comments or columns selected
    let fingerprintedBatch = batchArray.map((batch) => {
        return {
            ...batch,
            fingerprint: batch.sql.map((sql) => {
                return fingerprint(sql, false, true).replace(/^select(.+)from/, 'select * from')
            })
        };

    });

    //Lastly we group the batch statements by fingerprint
    //Assuming that group is a combination of unique fingerprints
    return fingerprintedBatch.reduce((acc, batch) => {
        let group = batch.fingerprint.join(' ');
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(batch);
        return acc;
    }, {});
};

/**
 * Removes the batch statements from the raw log output, as they contain valid SQL but are handled separately
 * @param {*} sql Log output from enabling SQL trace in a background script.
 * @returns The raw log output with the batch statements removed
 */
function removeBatchStatements(sql) {
    let batchStatementRegex = /Time: [\d:.]+ id: [\w\[\].]+ \(connpid=\d+\) for: SET AUTOCOMMIT=0[\s\S]+?END TRANSACTION/gm;
    return sql.replaceAll(batchStatementRegex, '');
};

/**
 * Parses the single statements from the raw log output, extracting the execution times, SQL statements and comments
 * It then groups them by fingerprint, a fingerprint is the SQL statement with literals, comments and columns selected removed.
 * @param {*} sql Log output from enabling SQL trace in a background script.
 * @returns An object with the single statements grouped by fingerprint
 */
function parseSingleStatements(sql) {
    let singleStatementRegex = /Time: (\d+:\d+:\d+\.\d+) id: .+ for: (.+)(\/\*.+\*\/)?/;

    //Remove the batch statements, they contain valid SQL but are handled separately
    let strippedSql = removeBatchStatements(sql);

    //Extract the execution time, SQL statements and comments
    let sqlArray = strippedSql.split('\n').map((line) => {
        let match = line.match(singleStatementRegex);
        if (match) {
            return {
                time: parseTime(match[1]),
                raw_sql: match[2],
                comment: match[3]
            }
        }
    }).filter((obj) => { return obj });

    //Fingerprint the SQL
    let fingerprintedSQL = sqlArray.map((line) => {
        if (line.raw_sql) {
            return {
                ...line,
                fingerprint: fingerprint(line.raw_sql, false, true).replace(/^select(.+)from/, 'select * from')
            }
        }
        return line;
    });

    //Group single statements by fingerprint
    let groupedSql = fingerprintedSQL.reduce((acc, line) => {
        if (line.fingerprint) {
            if (!acc[line.fingerprint]) {
                acc[line.fingerprint] = [];
            }
            acc[line.fingerprint].push(line);
        }
        return acc;
    }, {});

    return groupedSql;
};

/**
 * Parses the time from a string in the format HH:MM:SS:SSS to a number in milliseconds
 * @param {string} time A string in the format HH:MM:SS:SSS
 * @returns The time value in milliseconds
 */
function parseTime(time) {
    if (!time) return 0;
    let timeArray = time.split(':');
    let hours = parseInt(timeArray[0]);
    let minutes = parseInt(timeArray[1]);
    let seconds = parseFloat(timeArray[2]);
    return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000);
};

/**
 * Set the data rows to the view, and add a search filter
 * @param {*} dataRows An array of objects with the data to be displayed
 */
function setViewData(dataRows) {
    Object.entries(dataRows).forEach( // add check of empty fields to be able to filter out
        ([key, row]) => {
            try {
                let formatedSql = sqlFormatter.format(row.query, { language: 'mariadb', keywordCase: 'upper', dataTypeCase: 'upper' });
                row.query = '<pre>' + highlight.highlight(formatedSql, { html: true }) + '</pre>';
            }
            catch {
                row.query = '<pre>' + sql + '</pre>';
            }
        }
    );
    if (dtViewData) dtTables.destroy();
    var dtViewData = $('#dataexplore').DataTable({
        aaData: dataRows,
        order: [[0, "desc"]],
        aoColumns: [
            {
                mDataProp: "count"
            },
            {
                mDataProp: "query",
                bSearchable: true
            },
            {
                mDataProp: "duration"
            },
            {
                mDataProp: "type"
            },
        ],
        language: {
            info: "Matched: _TOTAL_ of _MAX_ row &nbsp;&nbsp;",
            infoFiltered: "",
            infoEmpty: "No matches found"
        },
        bLengthChange: false,
        bSortClasses: false,
        scrollY: "75vh",
        scrollCollapse: true,
        paging: false,
        dom: 'rti<"btns"B>',
        buttons: [
            "copyHtml5"
        ]

    });



    $('#tbxdataexplore').keyup(function () {
        let srch = $('#tbxdataexplore').val();
        dtViewData.search(srch, true).draw();
    }).focus().trigger('keyup');

    $('#waitingdataexplore').hide();

}

/**
 * Fingerprint the SQL statement to better group them by.
 * https://github.com/cou929/sql-fingerprint-js
 * @param {*} sql 
 * @param {*} matchMD5Checksum 
 * @param {*} matchEmbeddedNumbers 
 * @returns 
 */
function fingerprint(sql, matchMD5Checksum, matchEmbeddedNumbers) {
    let query = sql;

    // special cases
    if (/^SELECT \/\*!40001 SQL_NO_CACHE \*\/ \* FROM `/.test(query)) {
        return 'mysqldump';
    }
    if (/\/\*\w+\.\w+:[0-9]\/[0-9]\*\//.test(query)) {
        return 'percona-toolkit';
    }
    if (/^administrator command: /.test(query)) {
        return query;
    }
    const matchedCallStatement = query.match(/^\s*(call\s+\S+)\(/i);
    if (matchedCallStatement) {
        return matchedCallStatement[1].toLowerCase();
    }

    // shorten multi-value INSERT statement
    const matchedMultiValueInsert = query.match(/^((?:INSERT|REPLACE)(?: IGNORE)?\s+INTO.+?VALUES\s*\(.*?\))\s*,\s*\(/is);
    if (matchedMultiValueInsert) {
        // eslint-disable-next-line prefer-destructuring
        query = matchedMultiValueInsert[1];
    }

    // multi line comment
    query = query.replace(/\/\*[^!].*?\*\//g, '');

    // one_line_comment
    query = query.replace(/(?:--|#)[^'"\r\n]*(?=[\r\n]|$)/g, '');

    // USE statement
    if (/^use \S+$/i.test(query)) {
        return 'use ?';
    }

    // literals
    query = query.replace(/([^\\])(\\')/sg, '$1');
    query = query.replace(/([^\\])(\\")/sg, '$1');
    query = query.replace(/\\\\/sg, '');
    query = query.replace(/\\'/sg, '');
    query = query.replace(/\\"/sg, '');
    query = query.replace(/([^\\])(".*?[^\\]?")/sg, '$1?');
    query = query.replace(/([^\\])('.*?[^\\]?')/sg, '$1?');

    query = query.replace(/\bfalse\b|\btrue\b/isg, '?');

    if (matchMD5Checksum) {
        query = query.replace(/([._-])[a-f0-9]{32}/g, '$1?');
    }

    if (!matchEmbeddedNumbers) {
        query = query.replace(/[0-9+-][0-9a-f.xb+-]*/g, '?');
    } else {
        query = query.replace(/\b[0-9+-][0-9a-f.xb+-]*/g, '?');
    }

    if (matchMD5Checksum) {
        query = query.replace(/[xb+-]\?/g, '?');
    } else {
        query = query.replace(/[xb.+-]\?/g, '?');
    }

    // collapse whitespace
    query = query.replace(/^\s+/, '');
    query = query.replace(/[\r\n]+$/, '');
    query = query.replace(/[ \n\t\r\f]+/g, ' ');

    // to lower case
    query = query.toLowerCase();

    // get rid of null
    query = query.replace(/\bnull\b/g, '?');

    // collapse IN and VALUES lists
    query = query.replace(/\b(in|values?)(?:[\s,]*\([\s?,]*\))+/g, '$1(?+)');

    // collapse UNION
    query = query.replace(/\b(select\s.*?)(?:(\sunion(?:\sall)?)\s\1)+/g, '$1 /*repeat$2*/');

    // limit
    query = query.replace(/\blimit \?(?:, ?\?| offset \?)?/, 'limit ?');

    // order by
    query = query.replace(/\b(.+?)\s+ASC/gi, '$1');

    return query;
}
