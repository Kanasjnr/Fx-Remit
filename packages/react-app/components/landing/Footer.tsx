"use client"

export default function Footer() {
  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
          }
          .footer-container {
            height: auto !important;
            min-height: 786px !important;
            padding: 0 !important;
            margin: 0 !important;
            margin-top: 0 !important;
            position: relative !important;
            margin-bottom: -200px !important;
            padding-bottom: 0 !important;
            overflow: hidden !important;
          }
          .footer-inner-container {
            margin-top: 0 !important;
          }
          .footer-main-section {
            width: 100% !important;
            height: 786px !important;
            left: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            position: relative !important;
          }
          .footer-content {
            flex-direction: column !important;
            gap: 15px !important;
            padding: 20px !important;
            height: 100% !important;
          }
          .footer-left-section {
            width: 100% !important;
            height: auto !important;
            left: 0 !important;
            gap: 20px !important;
            margin: 0 !important;
            padding: 0 20px !important;
            align-items: center !important;
            margin-top: -50px !important;
          }
          .footer-description {
            width: 90% !important;
            max-width: 350px !important;
            height: auto !important;
            text-align: center !important;
            margin: 0 auto !important;
            padding: 0 10px !important;
          }
          .footer-powered-by {
            text-align: center !important;
          }
          .footer-right-section {
            
            height: auto !important;
            left: 0 !important;
            gap: 20px !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 40px !important;
            display: flex !important;
            justify-content: center !important;
            margin-top: -90px !important;
          }
            
          .footer-bg-image {
            width: 100% !important;
            height: 100% !important;
            top: 0 !important;
            left: 0 !important;
            object-fit: cover !important;
            opacity: 1 !important;
            z-index: 1 !important;
          }
          .footer-watermark {
            display: none !important;
          }
          .footer-internal-border {
            width: 90% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            top: 700px !important;
          }
          .footer-copyright {
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 90% !important;
            text-align: center !important;
            top: 720px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
        }
      `}</style>
      <footer 
        className="relative footer-container"
        style={{
          height: '829px',
          borderTop: '1px solid #00000033',
          opacity: 1,
          marginTop: '40px'
        }}
      >
      <div className="relative w-full flex justify-center footer-inner-container" style={{ marginTop: '50px' }}>
        {/* Main Section */}
        <div 
          className="relative footer-main-section"
          style={{
            width: '1300px',
            height: '503px',
            
            borderRadius: '50px',
            backgroundColor: '#F5F5F5',
            opacity: 1
          }}
        >
          {/* Background Pattern - Inside Section */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/blend 2.svg" 
              alt="Background pattern" 
              className="absolute footer-bg-image"
              style={{
                width: '1400px',
                height: '1100px',
                left: '270px',
                top: '-200px',
                opacity: 1
              }}
            />
          </div>
          {/* Internal Border */}
          <div 
            className="absolute footer-internal-border"
            style={{
              width: '1000px',
              height: '0px',
              border: '0.5px solid #05050533',
              left: '50%',
              top: '380px',
              transform: 'translateX(-50%)',
              opacity: 1
            }}
          />

          <div className="grid lg:grid-cols-2 gap-32 h-full p-12 footer-content">
          {/* Left Side - Company Info */}
            <div 
              className="flex flex-col justify-center footer-left-section"
              style={{
                width: '353px',
                height: '164px',
                gap: '10px',
                opacity: 1,
                marginTop: '60px'
              }}
            >
            <div className="flex items-center mb-6">
              <img 
                  src="/fx-remit.svg" 
                alt="FX Remit" 
                  className="h-12 w-auto mr-3"
              />
            
            </div>
              <p 
                className="footer-description"
                style={{
                  width: '353px',
                  height: '108px',
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#050505BF',
                  opacity: 1
                }}
              >
              Democratizing cross-border payments with blockchain technology. Send money globally with ultra low fees and lightning fast transactions.
            </p>
              <p 
                className="footer-powered-by"
                style={{
                  width: '353px',
                  height: '27px',
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#F18F01',
                  opacity: 1
                }}
              >
              Powered by Celo & Mento Protocol
            </p>
          </div>

          {/* Right Side - Links */}
            <div 
              className="absolute grid md:grid-cols-2 gap-8 footer-right-section"
              style={{ 
                right: '100px',
                top: '80px',
                
              }}
            >
            {/* Product Links */}
              <div 
                style={{
                  
                  height: '188px',
                  gap: '20px',
                  opacity: 1
                }}
              >
                <h3 
                  style={{
                   
                    height: '36px',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    textAlign: 'center',
                    opacity: 1,
                    marginBottom: '20px'
                  }}
                >
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Send money
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Track transfer
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Exchange rates
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
              <div 
                style={{
                  
                  height: '188px',
                  gap: '20px',
                  opacity: 1
                }}
              >
                <h3 
                  style={{
                    
                    height: '36px',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    textAlign: 'center',
                    opacity: 1,
                    marginBottom: '20px'
                  }}
                >
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                    <a 
                      href="#" 
                      style={{
                       
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Help center
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Contact us
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Security
                  </a>
                </li>
                <li>
                    <a 
                      href="#" 
                      style={{
                        
                        height: '27px',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '18px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        color: '#050505BF',
                        opacity: 1,
                        display: 'block'
                      }}
                    >
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

          {/* Copyright - Inside Section */}
          <div className="absolute footer-copyright" style={{ left: '515px', top: '410px' }}>
            <p 
              style={{
               
                height: '27px',
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#F18F01',
                opacity: 1
              }}
            >
            © 2025 FX - Remit. All rights reserved.
          </p>
          </div>
        </div>
      </div>

      {/* Watermark Logo */}
      <div className="absolute footer-watermark" style={{ left: '484px', top: '600px', zIndex: 10 }}>
        <img 
          src="/fx-remit.svg" 
          alt="FX Remit Watermark" 
          style={{
            width: '760px',
            height: '274px',
            opacity: 0.1,
            backdropFilter: 'blur(100px)',
            zIndex: 10,
            
          }}
        />
      </div>
    </footer>
    </>
  )
}