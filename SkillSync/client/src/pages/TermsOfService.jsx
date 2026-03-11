import React from 'react';

const TermsOfService = () => {
    return (
        <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Terms of Service</h1>
            
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Effective Date: {new Date().toLocaleDateString()}</p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Acceptance of Terms</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    By accessing or using the SkillSync platform, you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you may not access the platform.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. User Responsibilities</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    You are responsible for maintaining the confidentiality of your account credentials. Students must provide accurate information when applying for opportunities. Organizers must accurately verify student participation to maintain the integrity of the academic portfolio system.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Prohibited Conduct</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    Users may not falsify applications, create misleading opportunity postings, harass other members, or attempt to circumvent the cryptographic verification processes. Violation of these rules may result in immediate account termination.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Intellectual Property</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    The SkillSync name, logo, source code, and unified design tokens are the exclusive property of SkillSync administrators. Your use of the service does not grant you ownership over the platform. Any freelance work submitted by students remains the property of the respective parties as agreed upon outside of this platform.
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>5. Modification of Terms</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                    SkillSync reserves the right to update or modify these Terms of Service at any time. Continued use of the platform after such changes shall constitute your consent to such changes.
                </p>
            </div>
        </div>
    );
};

export default TermsOfService;
