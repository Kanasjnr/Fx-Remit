'use client';

import { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const form = e.target as HTMLFormElement;
      const formDataToSend = new FormData(form);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formDataToSend as any).toString(),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .contact-us-container {
            width: 100% !important;
            max-width: 400px !important;
            height: auto !important;
            min-height: 1200px !important;
            padding: 20px !important;
            flex-direction: column !important;
            gap: 20px !important;
            margin: 0 auto !important;
            position: relative !important;
            left: 0 !important;
            transform: none !important;
          }
          section {
            padding-left: 0 !important;
            padding-right: 0 !important;
            overflow-x: hidden !important;
          }
          .w-full {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 20px !important;
          }
          .contact-us-container[style*='width: 1320px'] {
            width: 100% !important;
            max-width: 400px !important;
            margin: 0 auto !important;
          }
          .contact-us-left {
            width: 100% !important;
            max-width: 400px !important;
            height: 298px !important;
            gap: 25px !important;
            margin: 0 auto !important;
            margin-top: 0 !important;
            opacity: 1 !important;
            position: relative !important;
            left: 0 !important;
          }
          .contact-us-right {
            width: 100% !important;
            max-width: 400px !important;
            margin: 0 auto !important;
            position: relative !important;
            left: 0 !important;
          }
          .contact-us-form {
            width: 100% !important;
            max-width: 400px !important;
            height: 818px !important;
            border-radius: 50px !important;
            opacity: 1 !important;
            margin: 0 auto !important;
            padding: 20px !important;
            padding-top: 60px !important;
            position: relative !important;
            left: 0 !important;
          }
          .contact-us-input-group {
            flex-direction: column !important;
            gap: 15px !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
          .contact-us-input {
            width: 100% !important;
            max-width: 331px !important;
            height: 87px !important;
            gap: 9px !important;
            opacity: 1 !important;
            margin: 0 auto !important;
            position: relative !important;
            left: 0 !important;
          }
          .contact-us-input input {
            width: 100% !important;
            max-width: 331px !important;
            height: 59px !important;
          }
          .contact-us-input textarea {
            width: 100% !important;
            max-width: 331px !important;
            height: 170px !important;
          }
          .contact-us-button {
            width: 100% !important;
            max-width: 210px !important;
            margin: 150px auto 0 auto !important;
            position: relative !important;
            left: 0 !important;
          }
          .contact-us-description {
            width: 100% !important;
            max-width: 400px !important;
            height: 81px !important;
            font-family: Inter !important;
            font-weight: 400 !important;
            font-size: 18px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
            color: #050505bf !important;
            opacity: 1 !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
      <section id="contact" className="py-16 px-4 bg-white">
        <div className="w-full flex justify-center px-4">
          <div
            className="contact-us-container flex gap-[100px] items-start"
            style={{
              width: '1320px',
              height: '679px',
              opacity: 1,
            }}
          >
            {/* Left Section - Contact Information */}
            <div
              className="contact-us-left flex flex-col items-start text-left"
              style={{
                
                height: '322px',
                gap: '20px',
                opacity: 1,
                marginTop: '80px',
                paddingLeft: '0',
              }}
            >
              {/* WANT TO REACH US */}
              <p
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#F18F01',
                  margin: 0,
                }}
              >
                WANT TO REACH US
              </p>

              {/* Contact us */}
              <h2
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '48px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#050505',
                  margin: 0,

                  height: '72px',
                }}
              >
                Contact us
              </h2>

              {/* Description */}
              <p
                className="contact-us-description"
                style={{
                  width: '476px',
                  height: '81px',
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#050505BF',
                  opacity: 1,
                  margin: 0,
                }}
              >
                We&apos;re here to help! Whether you have a question about our
                product, or need assistance or want to provide feedback, our
                team is ready to assist you.
              </p>

              {/* Email Section */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  alignItems: 'flex-start',
                  marginTop: '20px',
                }}
              >
                <span
                  style={{
                    width: '400px',
                    height: '19px',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#050505',
                    opacity: 1,
                  }}
                >
                  Email:
                </span>
                <a
                  href="mailto:team@fxremit.xyz"
                  style={{
                    width: '130px',
                    height: '19px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    textDecoration: 'underline',
                    color: '#05050580',
                    opacity: 1,
                  }}
                >
                  team@fxremit.xyz
                </a>
              </div>
            </div>

            {/* Right Section - Contact Form */}
            <div
              className="contact-us-right"
              style={{
                width: '784px',
                height: '719px',
                opacity: 1,
                paddingTop: '70px',
              }}
            >
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                className="contact-us-form rounded-[50px] p-8"
                onSubmit={handleSubmit}
                style={{
                  // width: '784px',
                  height: '679px',
                  backgroundColor: '#EAF2FF',
                  borderRadius: '50px',
                  padding: '32px',
                }}
              >
                {/* Hidden fields for Netlify */}
                <input type="hidden" name="form-name" value="contact" />
                <div style={{ display: 'none' }}>
                  <label>
                    Don&apos;t fill this out if you&apos;re human:{' '}
                    <input name="bot-field" />
                  </label>
                </div>

                {/* Name Fields */}
                {/* Name Fields */}
                <div
                  className="contact-us-input-group flex gap-4 mb-6 justify-center"
                  style={{
                    gap: '20px',
                    marginBottom: '24px',
                    marginTop: '40px',
                  }}
                >
                  <div
                    className="contact-us-input"
                    style={{
                      width: '331px',
                      height: '87px',
                      opacity: 1,
                      gap: '9px',
                    }}
                  >
                    <label
                      htmlFor="firstName"
                      style={{
                        width: '331px',
                        height: '19px',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#050505',
                        opacity: 1,
                        marginBottom: '9px',
                        display: 'block',
                      }}
                    >
                      First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="enter your first name"
                      required
                      style={{
                        width: '331px',
                        height: '59px',
                        paddingTop: '20px',
                        paddingRight: '10px',
                        paddingBottom: '20px',
                        paddingLeft: '10px',
                        border: '1px solid #05050533',
                        borderRadius: '5px',
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#05050580',
                        opacity: 1,
                        gap: '10px',
                      }}
                    />
                  </div>
                  <div
                    className="contact-us-input"
                    style={{
                      width: '331px',
                      height: '87px',
                      opacity: 1,
                      gap: '9px',
                    }}
                  >
                    <label
                      htmlFor="lastName"
                      style={{
                        width: '331px',
                        height: '19px',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#050505',
                        opacity: 1,
                        marginBottom: '9px',
                        display: 'block',
                      }}
                    >
                      Last name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="enter your last name"
                      required
                      style={{
                        width: '331px',
                        height: '59px',
                        paddingTop: '20px',
                        paddingRight: '10px',
                        paddingBottom: '20px',
                        paddingLeft: '10px',
                        border: '1px solid #05050533',
                        borderRadius: '5px',
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#05050580',
                        opacity: 1,
                        gap: '10px',
                      }}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div
                  className="mb-6 flex justify-center"
                  style={{ marginBottom: '24px', marginTop: '20px' }}
                >
                  <div
                    className="contact-us-input"
                    style={{
                      width: '684px',
                      height: '87px',
                      opacity: 1,
                      gap: '9px',
                    }}
                  >
                    <label
                      htmlFor="email"
                      style={{
                        width: '684px',
                        height: '19px',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#050505',
                        opacity: 1,
                        marginBottom: '9px',
                        display: 'block',
                      }}
                    >
                      Your email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="enter your email"
                      required
                      style={{
                        width: '684px',
                        height: '59px',
                        paddingTop: '20px',
                        paddingRight: '10px',
                        paddingBottom: '20px',
                        paddingLeft: '10px',
                        border: '1px solid #05050533',
                        borderRadius: '5px',
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#05050580',
                        opacity: 1,
                        gap: '10px',
                      }}
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div
                  className="mb-8 flex justify-center"
                  style={{ marginBottom: '32px', marginTop: '20px' }}
                >
                  <div
                    className="contact-us-input"
                    style={{
                      width: '684px',
                      height: '198px',
                      opacity: 1,
                      gap: '9px',
                    }}
                  >
                    <label
                      htmlFor="message"
                      style={{
                        width: '684px',
                        height: '19px',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#050505',
                        opacity: 1,
                        marginBottom: '9px',
                        display: 'block',
                      }}
                    >
                      Your message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="type your message here..."
                      rows={6}
                      required
                      style={{
                        width: '684px',
                        height: '170px',
                        paddingTop: '20px',
                        paddingRight: '10px',
                        paddingBottom: '20px',
                        paddingLeft: '10px',
                        border: '1px solid #05050533',
                        borderRadius: '5px',
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#05050580',
                        opacity: 1,
                        gap: '10px',
                        resize: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div
                  className="flex justify-center"
                  style={{ marginTop: '30px' }}
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="contact-us-button"
                    style={{
                      width: '210px',
                      height: '59px',
                      backgroundColor: isSubmitting ? '#7A9CC6' : '#2E5EAA',
                      color: '#F8F8FF',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      border: 'none',
                      borderRadius: '15px',
                      paddingTop: '20px',
                      paddingRight: '10px',
                      paddingBottom: '20px',
                      paddingLeft: '10px',
                      opacity: 1,
                      gap: '10px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting)
                        e.currentTarget.style.backgroundColor = '#1e4a8c';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting)
                        e.currentTarget.style.backgroundColor = '#2E5EAA';
                    }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#D4EDDA',
                      color: '#155724',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                    }}
                  >
                    ✓ Thank you! Your message has been sent successfully.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#F8D7DA',
                      color: '#721C24',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                    }}
                  >
                    ✗ Oops! Something went wrong. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
