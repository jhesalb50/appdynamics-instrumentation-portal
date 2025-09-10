
// validation.js - Shared validation for all AppDynamics generators
class AppDynamicsValidator {
    constructor() {
        this.validationRules = {
            'controller-host': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Controller host is required' };
                    if (!value.includes('.appdynamics.com')) return { severity: 'warning', message: 'Host should be a valid AppDynamics domain' };
                    if (value.includes(' ')) return { severity: 'error', message: 'Host cannot contain spaces' };
                    return { severity: 'success', message: 'Valid controller host' };
                }
            },
            'controller-port': {
                validate: (value) => {
                    const port = parseInt(value);
                    if (isNaN(port)) return { severity: 'error', message: 'Port must be a number' };
                    if (port < 1 || port > 65535) return { severity: 'error', message: 'Port must be between 1-65535' };
                    if (port !== 443 && port !== 80) return { severity: 'warning', message: 'Non-standard port detected' };
                    return { severity: 'success', message: 'Valid port' };
                }
            },
            'account-name': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Account name is required' };
                    if (value.length < 3) return { severity: 'error', message: 'Account name too short' };
                    if (value.includes(' ')) return { severity: 'warning', message: 'Spaces in account name may cause issues' };
                    return { severity: 'success', message: 'Valid account name' };
                }
            },
            'access-key': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Access key is required' };
                    if (value.length < 20) return { severity: 'error', message: 'Access key appears too short' };
                    if (value.includes(' ')) return { severity: 'error', message: 'Access key cannot contain spaces' };
                    if (!/[A-Z]/.test(value)) return { severity: 'warning', message: 'Access key should contain uppercase letters' };
                    if (!/[0-9]/.test(value)) return { severity: 'warning', message: 'Access key should contain numbers' };
                    return { severity: 'success', message: 'Valid access key format' };
                }
            },
            'app-name': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Application name is required' };
                    if (value.length > 50) return { severity: 'warning', message: 'Application name is very long' };
                    if (/[^a-zA-Z0-9_\-]/.test(value)) return { severity: 'warning', message: 'Special characters may cause issues' };
                    return { severity: 'success', message: 'Valid application name' };
                }
            },
            'tier-name': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Tier name is required' };
                    if (value.length > 30) return { severity: 'warning', message: 'Tier name is very long' };
                    return { severity: 'success', message: 'Valid tier name' };
                }
            },
            'node-name': {
                validate: (value) => {
                    if (!value) return { severity: 'error', message: 'Node name is required' };
                    if (value.length > 40) return { severity: 'warning', message: 'Node name is very long' };
                    return { severity: 'success', message: 'Valid node name' };
                }
            }
        };

        this.crossFieldValidations = [
            {
                validate: (values) => {
                    if (values['app-name'] && values['tier-name'] && values['app-name'] === values['tier-name']) {
                        return { severity: 'warning', message: 'Application and tier names are identical', field: 'tier-name' };
                    }
                    return null;
                }
            },
            {
                validate: (values) => {
                    if (values['node-name'] && values['tier-name'] && values['node-name'] === values['tier-name']) {
                        return { severity: 'warning', message: 'Node and tier names are identical', field: 'node-name' };
                    }
                    return null;
                }
            }
        ];
    }

    validateField(fieldId, value) {
        const rule = this.validationRules[fieldId];
        if (!rule) return { severity: 'info', message: 'No validation rules for this field' };
        return rule.validate(value);
    }

    validateAll(formData) {
        const results = [];
        
        Object.keys(formData).forEach(fieldId => {
            const result = this.validateField(fieldId, formData[fieldId]);
            results.push({ field: fieldId, severity: result.severity, message: result.message });
        });

        this.crossFieldValidations.forEach(rule => {
            const result = rule.validate(formData);
            if (result) results.push({ field: result.field, severity: result.severity, message: result.message });
        });

        return results;
    }

    getValidationSummary(results) {
        const errorCount = results.filter(r => r.severity === 'error').length;
        const warningCount = results.filter(r => r.severity === 'warning').length;
        
        if (errorCount > 0) return { severity: 'error', message: `${errorCount} error(s) must be fixed`, errorCount, warningCount };
        if (warningCount > 0) return { severity: 'warning', message: `${warningCount} warning(s) - review recommended`, errorCount, warningCount };
        return { severity: 'success', message: 'Configuration valid! Ready for deployment', errorCount, warningCount };
    }
}

// Utility functions
function setupFieldValidation(fieldId, validator) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.addEventListener('input', function() {
        validateField(fieldId, this.value, validator);
    });
    
    // Initial validation
    validateField(fieldId, input.value, validator);
}

function validateField(fieldId, value, validator) {
    const result = validator.validateField(fieldId, value);
    updateFieldUI(fieldId, result);
    return result.severity !== 'error';
}

function updateFieldUI(fieldId, result) {
    const input = document.getElementById(fieldId);
    const message = document.getElementById(`${fieldId}-message`);
    
    if (input && message) {
        input.className = input.className.replace(/\b(error|warning|success)\b/g, '');
        input.classList.add(result.severity);
        message.className = `validation-message message-${result.severity}`;
        message.textContent = result.message;
    }
}

function getValidationIcon(severity) {
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    return icons[severity] || '';
}

function validateAll(validator, customFields = {}) {
    const baseFields = {
        'controller-host': document.getElementById('controller-host')?.value,
        'controller-port': document.getElementById('controller-port')?.value,
        'account-name': document.getElementById('account-name')?.value,
        'access-key': document.getElementById('access-key')?.value,
        'app-name': document.getElementById('app-name')?.value,
        'tier-name': document.getElementById('tier-name')?.value,
        'node-name': document.getElementById('node-name')?.value
    };

    const formData = { ...baseFields, ...customFields };
    const results = validator.validateAll(formData);
    const summary = validator.getValidationSummary(results);
    
    displayValidationResults(results, summary);
    
    return summary.errorCount === 0;
}

function displayValidationResults(results, summary, containerId = 'validation-results') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="validation-summary summary-${summary.severity}">
            <strong>${summary.message}</strong>
        </div>
    `;

    results.forEach(result => {
        if (result.severity !== 'success') {
            container.innerHTML += `
                <div class="validation-result validation-${result.severity}">
                    <span style="margin-right: 0.5rem;">${getValidationIcon(result.severity)}</span>
                    ${result.message} (${result.field})
                </div>
            `;
        }
    });
}
