/**
 * SN Utils Config Backup/Restore Bookmarklet
 *
 * This bookmarklet allows you to backup and restore ServiceNow Utils
 * instance tag configurations (favicon overrides).
 *
 * Usage:
 * 1. Drag the bookmarklet to your bookmarks bar
 * 2. Click it on any ServiceNow instance
 * 3. Use the UI to backup or restore your configs
 */

(function() {
    const doc = document;

    // Prevent multiple instances
    if (doc.getElementById('snu-backup-ui')) return;

    // Inject styles
    const style = doc.createElement('style');
    style.textContent = `
        #snu-backup-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: system-ui, -apple-system, sans-serif;
            min-width: 400px;
        }

        #snu-backup-ui h3 {
            margin: 0 0 20px;
            color: #333;
            font-size: 24px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }

        #snu-backup-ui button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            margin: 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
        }

        #snu-backup-ui button:hover {
            background: #45a049;
            transform: translateY(-2px);
        }

        #snu-backup-ui button:active {
            transform: translateY(0);
        }

        #snu-backup-ui .close {
            background: #f44336;
            float: right;
            padding: 8px 16px;
            font-size: 14px;
        }

        #snu-backup-ui .close:hover {
            background: #da190b;
        }

        #snu-backup-ui .status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            display: none;
        }

        #snu-backup-ui .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }

        #snu-backup-ui .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        #snu-backup-ui .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            display: block;
        }

        #snu-backup-ui input[type="file"] {
            margin: 8px;
            padding: 8px;
            border: 2px dashed #4CAF50;
            border-radius: 6px;
            width: calc(100% - 16px);
        }

        #snu-backup-ui .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        #snu-backup-ui .button-group button {
            flex: 1;
        }
    `;
    doc.head.appendChild(style);

    // Create UI
    const ui = doc.createElement('div');
    ui.id = 'snu-backup-ui';
    ui.innerHTML = `
        <button class="close" onclick="this.parentElement.remove()">✕ Close</button>
        <h3>🔧 SN Utils Config Manager</h3>

        <div class="button-group">
            <button id="snu-backup-btn">💾 Backup Config</button>
            <button id="snu-view-btn">👁️ View Config</button>
        </div>

        <input type="file" id="snu-restore-input" accept=".json" style="display:none">
        <button id="snu-restore-btn" style="width:calc(100% - 16px);margin:16px 8px 8px">📥 Restore from File</button>

        <div id="snu-status" class="status"></div>
    `;
    doc.body.appendChild(ui);

    // Helper function to show status messages
    const showStatus = (message, type) => {
        const status = doc.getElementById('snu-status');
        status.textContent = message;
        status.className = 'status ' + type;
        setTimeout(() => status.style.display = 'none', 5000);
    };

    // Backup button handler
    doc.getElementById('snu-backup-btn').onclick = async () => {
        try {
            // Get all sync storage data
            const data = await chrome.storage.sync.get(null);

            // Filter for instance tag configs
            const configs = {};
            Object.keys(data).forEach(key => {
                if (key.includes('-instancetag')) {
                    configs[key] = data[key];
                }
            });

            if (Object.keys(configs).length === 0) {
                showStatus('No instance tag configs found!', 'error');
                return;
            }

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = doc.createElement('a');
            a.href = url;
            a.download = `sn-utils-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            showStatus(`✓ Backed up ${Object.keys(configs).length} configs!`, 'success');
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
        }
    };

    // View button handler
    doc.getElementById('snu-view-btn').onclick = async () => {
        try {
            // Get all sync storage data
            const data = await chrome.storage.sync.get(null);

            // Filter for instance tag configs
            const configs = {};
            Object.keys(data).forEach(key => {
                if (key.includes('-instancetag')) {
                    configs[key] = data[key];
                }
            });

            if (Object.keys(configs).length === 0) {
                showStatus('No instance tag configs found!', 'info');
                return;
            }

            console.log('SN Utils Instance Tag Configs:', configs);
            showStatus(`Found ${Object.keys(configs).length} configs - check console (F12)`, 'info');
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
        }
    };

    // Restore button handler
    doc.getElementById('snu-restore-btn').onclick = () => {
        doc.getElementById('snu-restore-input').click();
    };

    // File input handler
    doc.getElementById('snu-restore-input').onchange = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            const configs = JSON.parse(text);

            // Restore to chrome storage
            await chrome.storage.sync.set(configs);

            showStatus(`✓ Restored ${Object.keys(configs).length} configs!`, 'success');

            // Reload page to apply changes
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
        }
    };
})();
