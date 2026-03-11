import React from 'react';

const FAQ = () => {
    return (
        <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Frequently Asked Questions</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                Find answers to common questions about using SkillSync as a student or event organizer.
            </p>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>What is SkillSync?</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        SkillSync is a centralized academic marketplace that connects students with verified volunteering and freelance gig opportunities within their institution, helping them build a cryptographically verified portfolio.
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Who can post opportunities?</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        Only verified Organizers (such as club representatives, department heads, or trusted institutional staff) can post gigs and volunteering events. This ensures that all opportunities are legitimate and safe for students.
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>How do I get my experience verified?</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        When you complete a gig or attend a volunteering event, the organizer will review your participation. Upon their approval, the experience is permanently verified and added to your SkillSync academic portfolio.
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>How do I contact support?</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        If you are logged into your account, you can reach out directly to your institution's administrators or organizers via the Inbox. If you cannot log in, please use the "Email Admin" button located in the footer.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
