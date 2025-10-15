'use client';

import { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .contact-us-container {
            width: 400px !important;
            height: auto !important;
            min-height: 1000px !important;
            margin: 0 auto !important;
          }
          .contact-us-left {
            width: 400px !important;
            height: 298px !important;
            margin: 0 auto !important;
            gap: 25px !important;
          }
          .contact-us-form {
            width: 400px !important;
            height: 818px !important;
            margin: 0 auto !important;
            border-radius: 50px !important;
          }
          .contact-us-field-first-name,
          .contact-us-field-last-name,
          .contact-us-field-email,
          .contact-us-field-message {
            width: 331px !important;
            position: absolute !important;
          }
          .contact-us-field-first-name {
            top: 72px !important;
            left: 35px !important;
          }
          .contact-us-field-last-name {
            top: 179px !important;
            left: 35px !important;
          }
          .contact-us-field-email {
            top: 286px !important;
            left: 35px !important;
          }
          .contact-us-field-message {
            top: 393px !important;
            left: 35px !important;
            height: 170px !important;
          }
          .contact-us-form button {
            position: absolute !important;
            top: 611px !important;
            left: 95px !important;
            width: 210px !important;
            height: 59px !important;
          }
        }
      `}</style>
      <section className="py-20 sm:py-32 bg-white">
        <div className="w-full flex justify-start px-8">
          <div className="grid lg:grid-cols-2 gap-[40px] contact-us-container" style={{ width: '1000px', height: '679px', marginLeft: '150px' }}>
          {/* Left Side - Information */}
          <div className="flex flex-col gap-6 lg:gap-5 lg:mt-20">
            <div
              className="contact-us-label"
              style={{
                height: '27px',
                opacity: 1,
                fontFamily: 'SF Pro Rounded',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#F18F01',
              }}
            >
              WANT TO REACH US
            </div>
            <h2
              className="contact-us-title"
              style={{
                width: '225px',
                height: '72px',
                opacity: 1,
                fontFamily: 'SF Pro Rounded',
                fontWeight: 500,
                fontSize: '48px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#050505',
              }}
            >
              Contact us
            </h2>
            <p className="text-lg leading-[150%] text-[#050505BF] font-[SF Pro Rounded]">
              We&apos;re here to help! Whether you have a question about our
              product, or need assistance or want to provide feedback, our team
              is ready to assist you.
            </p>
            <div className="flex flex-col gap-4">
              <div
                className="contact-us-email-label"
                style={{
                  fontFamily: 'Inter 28pt',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#050505',
                }}
              >
                Email:
              </div>
              <div
                className="contact-us-email-address"
                style={{
                  width: '130px',
                  height: '19px',
                  opacity: 1,
                  fontFamily: 'Inter 28pt',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  textDecoration: 'underline',
                  textDecorationStyle: 'solid',
                  textDecorationThickness: '0%',
                  textDecorationSkipInk: 'auto',
                  color: '#05050580',
                }}
              >
                team@fxremit.xyz
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div 
            className="contact-us-form lg:w-[784px] w-full lg:h-[679px] h-[818px]"
            style={{
              opacity: 1,
              borderRadius: '50px',
              backgroundColor: '#EAF2FF',
              position: 'relative',
            }}
          >
            <form onSubmit={handleSubmit} className="contact-us-form-inner">
              {/* First Name Field */}
              <div 
                className="contact-us-field-first-name lg:w-[331px] w-full lg:h-[87px] h-[87px] lg:top-[72px] top-[72px] lg:left-[50px] left-[20px] lg:right-auto right-[20px]"
                style={{
                  opacity: 1,
                  gap: '9px',
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label 
                  htmlFor="firstName"
                  style={{
                    width: '331px',
                    height: '19px',
                    opacity: 1,
                    fontFamily: 'Inter 28pt',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#050505',
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
                  style={{
                    width: '331px',
                    height: '59px',
                    opacity: 1,
                    gap: '10px',
                    borderRadius: '5px',
                    paddingTop: '20px',
                    paddingRight: '10px',
                    paddingBottom: '20px',
                    paddingLeft: '10px',
                    border: '1px solid #05050533',
                    fontFamily: 'Inter 28pt',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#05050580',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Last Name Field */}
              <div 
                className="contact-us-field-last-name lg:w-[331px] w-full lg:h-[87px] h-[87px] lg:top-[72px] top-[179px] lg:left-[403px] left-[20px] lg:right-auto right-[20px]"
                style={{
                  opacity: 1,
                  gap: '9px',
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label 
                  htmlFor="lastName"
                  style={{
                    width: '331px',
                    height: '19px',
                    opacity: 1,
                    fontFamily: 'Inter 28pt',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#050505',
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
                  style={{
                    width: '331px',
                    height: '59px',
                    opacity: 1,
                    gap: '10px',
                    borderRadius: '5px',
                    paddingTop: '20px',
                    paddingRight: '10px',
                    paddingBottom: '20px',
                    paddingLeft: '10px',
                    border: '1px solid #05050533',
                    fontFamily: 'Inter 28pt',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#05050580',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Email Field */}
              <div 
                className="contact-us-field-email lg:w-[684px] w-full lg:h-[87px] h-[87px] lg:top-[194px] top-[286px] lg:left-[50px] left-[20px] lg:right-auto right-[20px]"
                style={{
                  opacity: 1,
                  gap: '9px',
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label 
                  htmlFor="email"
                  style={{
                    width: '684px',
                    height: '19px',
                    opacity: 1,
                    fontFamily: 'Inter 28pt',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#050505',
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
                  placeholder="email address"
                  className="lg:w-[684px] w-[331px] lg:h-[59px] h-[59px]"
                  style={{
                    opacity: 1,
                    gap: '10px',
                    borderRadius: '5px',
                    paddingTop: '20px',
                    paddingRight: '10px',
                    paddingBottom: '20px',
                    paddingLeft: '10px',
                    border: '1px solid #05050533',
                    fontFamily: 'Inter 28pt',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#05050580',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Message Field */}
              <div 
                className="contact-us-field-message lg:w-[684px] w-full lg:h-[198px] h-[170px] lg:top-[316px] top-[393px] lg:left-[50px] left-[20px] lg:right-auto right-[20px]"
                style={{
                  opacity: 1,
                  gap: '9px',
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label 
                  htmlFor="message"
                  style={{
                    width: '684px',
                    height: '19px',
                    opacity: 1,
                    fontFamily: 'Inter 28pt',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#050505',
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
                  className="lg:w-[684px] w-[331px] lg:h-[170px] h-[170px]"
                  style={{
                    opacity: 1,
                    gap: '10px',
                    borderRadius: '5px',
                    paddingTop: '20px',
                    paddingRight: '10px',
                    paddingBottom: '20px',
                    paddingLeft: '10px',
                    border: '1px solid #05050533',
                    fontFamily: 'Inter 28pt',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#05050580',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="lg:w-[210px] w-full max-w-[210px] lg:h-[59px] h-[59px] lg:top-[577px] top-[611px] lg:left-[287px] left-[20px] lg:right-auto right-[20px]"
                style={{
                  opacity: 1,
                  gap: '10px',
                  borderRadius: '15px',
                  paddingTop: '20px',
                  paddingRight: '10px',
                  paddingBottom: '20px',
                  paddingLeft: '10px',
                  backgroundColor: '#2E5EAA',
                  border: 'none',
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#FFFFFF',
                  position: 'absolute',
                  cursor: 'pointer',
                }}
              >
                Send message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
