/**
 * Main JavaScript for Smart DNS Proxy Web Interface
 */

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    feather.replace();
    
    // Initialize tab navigation
    initTabs();
    
    // Load initial data
    loadDashboardData();
    loadDomainsList();
    loadSettingsData();
    loadLogs();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Initialize tab navigation
 */
function initTabs() {
    const tabLinks = document.querySelectorAll('.nav-link');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            tabLinks.forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show the corresponding section
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).classList.add('active');
        });
    });
}

/**
 * Set up event listeners for the UI
 */
function setupEventListeners() {
    // Dashboard refresh button
    document.getElementById('refresh-status').addEventListener('click', loadDashboardData);
    
    // Add domain button in modal
    document.getElementById('add-domain-btn').addEventListener('click', addDomain);
    
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Add DNS server button
    document.getElementById('add-dns-server').addEventListener('click', addDnsServerField);
    
    // Enable/disable auth fields based on checkbox
    document.getElementById('enable-auth').addEventListener('change', function() {
        const authFields = document.querySelector('.auth-fields');
        if (this.checked) {
            authFields.style.display = 'flex';
        } else {
            authFields.style.display = 'none';
        }
    });
    
    // Logs refresh button
    document.getElementById('refresh-logs').addEventListener('click', loadLogs);
    
    // Logs clear button
    document.getElementById('clear-logs').addEventListener('click', clearLogs);
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
    fetch('/api/status')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update system information
            document.getElementById('dns-version').textContent = data.version || 'Unknown';
            document.getElementById('dns-port').textContent = data.port || '53';
            document.getElementById('system-uptime').textContent = data.uptime || 'Unknown';
            document.getElementById('last-update').textContent = data.lastUpdate || 'Never';
            
            // Update stats
            document.getElementById('domains-count').textContent = data.domainCount || '0';
            document.getElementById('dns-queries').textContent = data.queryCount || '0';
            document.getElementById('cache-size').textContent = data.cacheEntries || '0';
            
            // Update DNS status
            const dnsStatus = document.querySelector('.dns-status');
            if (data.running) {
                dnsStatus.innerHTML = '<span class="status-indicator running"><i data-feather="check-circle"></i> Running</span>';
            } else {
                dnsStatus.innerHTML = '<span class="status-indicator stopped"><i data-feather="x-circle"></i> Stopped</span>';
            }
            
            // Re-initialize feather icons for newly added elements
            feather.replace();
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
            showAlert('Error loading dashboard data. Please try again later.', 'danger');
        });
}

/**
 * Load domains list
 */
function loadDomainsList() {
    fetch('/api/domains')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const domainsList = document.getElementById('domains-list');
            domainsList.innerHTML = '';
            
            if (data.domains && data.domains.length > 0) {
                data.domains.forEach(domain => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${domain.domain}</td>
                        <td>${domain.resolveVia}</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>
                            <div class="dns-entry-actions">
                                <button class="btn btn-sm btn-outline-danger delete-domain" data-domain="${domain.domain}">
                                    <i data-feather="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    domainsList.appendChild(row);
                });
                
                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-domain').forEach(button => {
                    button.addEventListener('click', function() {
                        const domain = this.getAttribute('data-domain');
                        showDeleteConfirmation(domain);
                    });
                });
                
                // Re-initialize feather icons
                feather.replace();
            } else {
                domainsList.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">No domains configured</td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching domains list:', error);
            showAlert('Error loading domains list. Please try again later.', 'danger');
        });
}

/**
 * Add a new domain
 */
function addDomain() {
    const domainName = document.getElementById('domain-name').value.trim();
    const dnsServer = document.getElementById('dns-server').value.trim();
    
    if (!domainName || !dnsServer) {
        showAlert('Please enter both domain name and DNS server', 'warning');
        return;
    }
    
    // Simple validation for domain format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) {
        showAlert('Please enter a valid domain name', 'warning');
        return;
    }
    
    // Simple validation for IP address format
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(dnsServer)) {
        showAlert('Please enter a valid IP address for the DNS server', 'warning');
        return;
    }
    
    fetch('/api/domains', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            domain: domainName,
            resolveVia: dnsServer
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDomainModal'));
            modal.hide();
            
            // Clear form fields
            document.getElementById('domain-name').value = '';
            document.getElementById('dns-server').value = '';
            
            // Reload domains list
            loadDomainsList();
            
            // Update dashboard
            loadDashboardData();
            
            // Show success message
            showAlert('Domain added successfully', 'success');
        } else {
            showAlert(data.message || 'Failed to add domain', 'danger');
        }
    })
    .catch(error => {
        console.error('Error adding domain:', error);
        showAlert('Error adding domain. Please try again later.', 'danger');
    });
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation(domain) {
    document.getElementById('delete-domain-name').textContent = domain;
    
    // Set up confirm button
    document.getElementById('confirm-delete-btn').onclick = function() {
        deleteDomain(domain);
    };
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
}

/**
 * Delete a domain
 */
function deleteDomain(domain) {
    fetch(`/api/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
            modal.hide();
            
            // Reload domains list
            loadDomainsList();
            
            // Update dashboard
            loadDashboardData();
            
            // Show success message
            showAlert('Domain deleted successfully', 'success');
        } else {
            showAlert(data.message || 'Failed to delete domain', 'danger');
        }
    })
    .catch(error => {
        console.error('Error deleting domain:', error);
        showAlert('Error deleting domain. Please try again later.', 'danger');
    });
}

/**
 * Load settings data
 */
function loadSettingsData() {
    fetch('/api/settings')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // DNS Server settings
            document.getElementById('dns-server-port').value = data.dnsServer.port || 53;
            document.getElementById('cache-size-input').value = data.dnsServer.cacheSize || 1000;
            document.getElementById('log-queries').checked = data.dnsServer.logQueries || false;
            
            // Alternative DNS servers
            const alternativeDnsContainer = document.getElementById('alternative-dns-container');
            alternativeDnsContainer.innerHTML = '';
            
            if (data.alternativeDNS && data.alternativeDNS.length > 0) {
                data.alternativeDNS.forEach((dns, index) => {
                    alternativeDnsContainer.appendChild(createDnsServerElement(dns, index));
                });
            } else {
                alternativeDnsContainer.appendChild(createDnsServerElement('8.8.8.8', 0));
            }
            
            // Web interface settings
            document.getElementById('web-port').value = data.webInterface.port || 5000;
            document.getElementById('enable-auth').checked = data.webInterface.enableAuth || false;
            document.getElementById('username').value = data.webInterface.username || 'admin';
            
            // Show/hide auth fields
            const authFields = document.querySelector('.auth-fields');
            if (data.webInterface.enableAuth) {
                authFields.style.display = 'flex';
            } else {
                authFields.style.display = 'none';
            }
            
            // Re-initialize feather icons
            feather.replace();
        })
        .catch(error => {
            console.error('Error fetching settings data:', error);
            showAlert('Error loading settings. Please try again later.', 'danger');
        });
}

/**
 * Create a DNS server input element
 */
function createDnsServerElement(dnsServer, index) {
    const div = document.createElement('div');
    div.className = 'alternative-dns-entry';
    div.innerHTML = `
        <input type="text" class="form-control dns-server-input" name="alternativeDNS[${index}]" value="${dnsServer}">
        <button type="button" class="btn btn-sm btn-outline-danger remove-dns-server">
            <i data-feather="x"></i>
        </button>
    `;
    
    // Add event listener for remove button
    div.querySelector('.remove-dns-server').addEventListener('click', function() {
        div.remove();
    });
    
    return div;
}

/**
 * Add a new DNS server input field
 */
function addDnsServerField() {
    const alternativeDnsContainer = document.getElementById('alternative-dns-container');
    const index = alternativeDnsContainer.querySelectorAll('.alternative-dns-entry').length;
    alternativeDnsContainer.appendChild(createDnsServerElement('', index));
    
    // Re-initialize feather icons
    feather.replace();
}

/**
 * Save settings
 */
function saveSettings() {
    // Collect DNS server settings
    const dnsServerPort = parseInt(document.getElementById('dns-server-port').value);
    const cacheSize = parseInt(document.getElementById('cache-size-input').value);
    const logQueries = document.getElementById('log-queries').checked;
    
    // Collect alternative DNS servers
    const dnsServerInputs = document.querySelectorAll('.dns-server-input');
    const alternativeDNS = Array.from(dnsServerInputs)
        .map(input => input.value)
        .filter(value => value.trim() !== '');
    
    // Collect web interface settings
    const webPort = parseInt(document.getElementById('web-port').value);
    const enableAuth = document.getElementById('enable-auth').checked;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Create settings object
    const settings = {
        dnsServer: {
            port: dnsServerPort,
            cacheSize: cacheSize,
            logQueries: logQueries
        },
        alternativeDNS: alternativeDNS,
        webInterface: {
            port: webPort,
            enableAuth: enableAuth,
            username: username
        }
    };
    
    // Add password only if it was changed
    if (password) {
        settings.webInterface.password = password;
    }
    
    // Save settings
    fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Settings saved successfully. The DNS service is restarting.', 'success');
            
            // Reload settings and dashboard after a short delay
            setTimeout(() => {
                loadSettingsData();
                loadDashboardData();
            }, 2000);
        } else {
            showAlert(data.message || 'Failed to save settings', 'danger');
        }
    })
    .catch(error => {
        console.error('Error saving settings:', error);
        showAlert('Error saving settings. Please try again later.', 'danger');
    });
}

/**
 * Load logs
 */
function loadLogs() {
    // Load DNS logs
    fetch('/api/logs/dns')
        .then(response => response.text())
        .then(data => {
            document.getElementById('dns-logs-content').textContent = data || 'No DNS logs available';
        })
        .catch(error => {
            console.error('Error loading DNS logs:', error);
            document.getElementById('dns-logs-content').textContent = 'Error loading DNS logs';
        });
    
    // Load access logs
    fetch('/api/logs/access')
        .then(response => response.text())
        .then(data => {
            document.getElementById('access-logs-content').textContent = data || 'No access logs available';
        })
        .catch(error => {
            console.error('Error loading access logs:', error);
            document.getElementById('access-logs-content').textContent = 'Error loading access logs';
        });
    
    // Load error logs
    fetch('/api/logs/error')
        .then(response => response.text())
        .then(data => {
            document.getElementById('error-logs-content').textContent = data || 'No error logs available';
        })
        .catch(error => {
            console.error('Error loading error logs:', error);
            document.getElementById('error-logs-content').textContent = 'Error loading error logs';
        });
}

/**
 * Clear logs
 */
function clearLogs() {
    fetch('/api/logs/clear', {
        method: 'POST',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Logs cleared successfully', 'success');
            loadLogs();
        } else {
            showAlert(data.message || 'Failed to clear logs', 'danger');
        }
    })
    .catch(error => {
        console.error('Error clearing logs:', error);
        showAlert('Error clearing logs. Please try again later.', 'danger');
    });
}

/**
 * Show an alert message
 */
function showAlert(message, type = 'info') {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to the top of the main content
    const mainContent = document.querySelector('main');
    mainContent.insertBefore(alertElement, mainContent.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
    }, 5000);
}
