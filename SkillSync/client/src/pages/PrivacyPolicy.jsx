import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Privacy Policy</h1>
            
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Information We Collect</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    When you register for a SkillSync account, we collect your name, institutional email address, and institutional code. We also track your participation in verified gigs and volunteering events to build your academic portfolio.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. How We Use Your Information</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    Your information is used solely to provide the SkillSync service. This includes verifying your institutional identity, connecting you with relevant opportunities, allowing organizers to contact you, and maintaining your permanent cryptographically verified record of achievements.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Information Sharing</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    SkillSync does not sell your personal data. Your profile and participation history are only shared with authorized organizers within your registered institution. Your public profile operates strictly on an opt-in basis.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Data Security</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    We implement standard security measures to protect your academic records and personal details. Authentication tokens are securely stored and managed to prevent unauthorized access to your account.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>5. Contact Us</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                    If you have questions regarding this Privacy Policy or your data, please contact the administrators via your organization's internal contact methods, or email the global admin via the footer link.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
