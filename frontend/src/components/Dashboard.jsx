// Dashboard.jsx
import React, { useState } from 'react';
import {
  Mail,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
} from 'lucide-react';
import './Dashboard.css';

export default function EmailFinderChecker() {
  const [activeTab, setActiveTab] = useState('finder');
  const [finderInput, setFinderInput] = useState({
    firstName: '',
    lastName: '',
    domain: '',
  });
  const [finderResults, setFinderResults] = useState([]);
  const [checkerResults, setCheckerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [error, setError] = useState('');

  const generateEmailPatterns = (firstName, lastName, domain) => {
    const f = firstName.toLowerCase().trim();
    const l = lastName.toLowerCase().trim();
    const d = domain.toLowerCase().trim();
    const fInitial = f.charAt(0);
    const lInitial = l.charAt(0);

    return [
      `${f}.${l}@${d}`,
      `${f}${l}@${d}`,
      `${fInitial}${l}@${d}`,
      `${f}${lInitial}@${d}`,
      `${f}_${l}@${d}`,
      `${f}-${l}@${d}`,
      `${l}.${f}@${d}`,
      `${fInitial}.${l}@${d}`,
    ];
  };

  const validateEmailFormat = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const checkEmailValidity = (email) => {
    if (!validateEmailFormat(email)) {
      return { status: 'invalid', confidence: 0 };
    }
    const random = Math.random();
    if (random > 0.7) {
      return { status: 'valid', confidence: 85 + Math.floor(Math.random() * 15) };
    } else if (random > 0.4) {
      return { status: 'risky', confidence: 50 + Math.floor(Math.random() * 30) };
    } else {
      return { status: 'invalid', confidence: 20 + Math.floor(Math.random() * 30) };
    }
  };

  const handleFindEmails = () => {
    const { firstName, lastName, domain } = finderInput;
    setError('');

    if (!firstName || !lastName || !domain) {
      setError('Please fill in all fields before searching.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const patterns = generateEmailPatterns(firstName, lastName, domain);
      const results = patterns.map((email) => ({
        email,
        ...checkEmailValidity(email),
      }));
      setFinderResults(results);
      setLoading(false);
    }, 700);
  };

  const handleCheckEmails = () => {
    setError('');
    const emails = bulkEmails
      .split('\n')
      .map((e) => e.trim())
      .filter(Boolean);

    if (!emails.length) {
      setError('Please enter at least one email to verify.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const results = emails.map((email) => ({
        email,
        ...checkEmailValidity(email),
      }));
      setCheckerResults(results);
      setLoading(false);
    }, 700);
  };

  const copyToClipboard = (text) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
  };

  const downloadResults = (results) => {
    if (!results.length) return;
    const csv =
      'Email,Status,Confidence\n' +
      results.map((r) => `${r.email},${r.status},${r.confidence}%`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const activeResults = activeTab === 'finder' ? finderResults : checkerResults;

  const getStatusClass = (status) => {
    if (status === 'valid') return 'pill pill-valid';
    if (status === 'invalid') return 'pill pill-invalid';
    if (status === 'risky') return 'pill pill-risky';
    return 'pill';
  };

  const getStatusIcon = (status) => {
    if (status === 'valid') return <CheckCircle size={14} />;
    if (status === 'invalid') return <XCircle size={14} />;
    if (status === 'risky') return <AlertCircle size={14} />;
    return null;
  };

  const summary = activeResults.reduce(
    (acc, r) => {
      acc.total++;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0, valid: 0, risky: 0, invalid: 0 }
  );

  return (
    <div className="email-dashboard">
      <div className="email-dashboard__card">
        <header className="email-header">
          <div className="email-header__icon">
            <Mail size={18} />
          </div>
          <div>
            <h1 className="email-header__title">Email Finder &amp; Checker</h1>
            <p className="email-header__subtitle">
              Find patterns &amp; validate email addresses in seconds.
            </p>
          </div>
        </header>

        <p className="email-demo-note">Demo mode · Simulated results</p>

        <div className="email-tabs">
          <button
            className={
              'email-tab' + (activeTab === 'finder' ? ' email-tab--active' : '')
            }
            onClick={() => {
              setActiveTab('finder');
              setError('');
            }}
          >
            <Search size={16} />
            Finder
          </button>
          <button
            className={
              'email-tab' + (activeTab === 'checker' ? ' email-tab--active' : '')
            }
            onClick={() => {
              setActiveTab('checker');
              setError('');
            }}
          >
            <CheckCircle size={16} />
            Checker
          </button>
        </div>

        <p className="email-helper">
          {activeTab === 'finder'
            ? 'Generate likely email patterns from a name and company domain.'
            : 'Paste emails (one per line) to verify multiple addresses at once.'}
        </p>

        {/* error */}
        {error && (
          <div className="email-error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Finder vs Checker */}
        {activeTab === 'finder' ? (
          <>
            {/* HORIZONTAL FINDER FORM */}
            <div className="finder-inline">
              <div className="fg">
                <label>First Name</label>
                <input
                  type="text"
                  value={finderInput.firstName}
                  onChange={(e) =>
                    setFinderInput({ ...finderInput, firstName: e.target.value })
                  }
                  placeholder="John"
                />
              </div>

              <div className="fg">
                <label>Last Name</label>
                <input
                  type="text"
                  value={finderInput.lastName}
                  onChange={(e) =>
                    setFinderInput({ ...finderInput, lastName: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>

              <div className="fg">
                <label>Company Domain</label>
                <input
                  type="text"
                  value={finderInput.domain}
                  onChange={(e) =>
                    setFinderInput({ ...finderInput, domain: e.target.value })
                  }
                  placeholder="company.com"
                />
              </div>

              <button
                className="btn-find"
                onClick={handleFindEmails}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Finding…
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Find
                  </>
                )}
              </button>
            </div>

            <p className="form-tip">
              Use the main domain only, without https:// or www.
            </p>
          </>
        ) : (
          <>
            <div className="checker-block">
              <label>Email Addresses (one per line)</label>
              <textarea
                rows={6}
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder={`john@company.com\njane@brand.com`}
              />
              <p className="form-tip">We will validate all emails in bulk.</p>
            </div>

            <button
              className="btn-primary"
              onClick={handleCheckEmails}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Checking…
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Verify
                </>
              )}
            </button>
          </>
        )}

        {/* results */}
        {(finderResults.length > 0 || checkerResults.length > 0) && (
          <section className="results-section">
            <div className="results-summary">
              <div className="summary-card">
                <span className="summary-label">Total</span>
                <span className="summary-value">{summary.total}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Valid</span>
                <span className="summary-value summary-value--valid">
                  {summary.valid}
                </span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Risky</span>
                <span className="summary-value summary-value--risky">
                  {summary.risky}
                </span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Invalid</span>
                <span className="summary-value summary-value--invalid">
                  {summary.invalid}
                </span>
              </div>
            </div>

            <div className="results-card">
              <div className="results-header">
                <div>
                  <div className="results-title">Results</div>
                  <div className="results-subtitle">
                    {activeTab === 'finder' ? 'Finder' : 'Checker'} ·{' '}
                    {activeResults.length} rows
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => downloadResults(activeResults)}
                  disabled={!activeResults.length}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>

              <div className="results-list">
                {activeResults.map((result, idx) => (
                  <div className="result-row" key={idx}>
                    <div className="result-main">
                      <div className="result-email" title={result.email}>
                        {result.email}
                      </div>
                      <div className="result-meta">
                        Confidence:{' '}
                        <span className="result-meta-strong">
                          {result.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="result-actions">
                      <span className={getStatusClass(result.status)}>
                        {getStatusIcon(result.status)}
                        <span>{result.status}</span>
                      </span>
                      <button
                        className="icon-btn"
                        onClick={() => copyToClipboard(result.email)}
                        title="Copy email"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {!activeResults.length && (
                  <div className="results-empty">
                    No results yet. Run a search to see suggestions.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
