'use client';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-4 bg-white">
      <div className="w-full flex justify-center">
        <div
          className="relative p-12 overflow-hidden how-it-works-container"
          style={{
            backgroundColor: '#2E5EAA',
            borderRadius: '50px',
            height: '672px',
            width: '1320px'
          }}
        >
          {/* Background Pattern */}
          <div
            className="absolute pattern-element"
            style={{
              width: '224px',
              height: '224px',
              top: '498px',
              left: '-90px',
              opacity: 0.5,
            }}
          >
            <img src="/pattern.svg" alt="Pattern" className="w-full h-full" />
          </div>

          {/* Circular Badge */}
          <div
            className="absolute badge-element"
            style={{
              width: '535px',
              height: '535px',
              top: '-124px',
              right: '-190px',
              opacity: 0.5,
            }}
          >
            <img
              src="/badge.svg"
              alt="FX Remit Badge"
              className="w-full h-full"
            />
          </div>

          {/* Header */}
          <div className="relative z-10 header-section" style={{ paddingLeft: '80px', paddingTop: '60px' }}>
            <div>
              <div 
                className="text-[#E8A040] uppercase mb-4"
                style={{
                  fontFamily: 'SF Pro Rounded',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '150%',
                  letterSpacing: '0%'
                }}
              >
                LEARN ABOUT US
              </div>
              <h2 
                className="text-white main-heading"
                style={{
                  fontFamily: 'SF Pro Rounded',
                  fontWeight: 500,
                  fontSize: '48px',
                  lineHeight: '150%',
                  letterSpacing: '0%'
                }}
              >
                Here's how it works
              </h2>
            </div>
          </div>

            <div
              className="absolute flex steps-container"
              style={{
                width: '1052px',
                height: '223px',
                top: '400px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                justifyContent: 'space-between',
                opacity: 1
              }}
            >
              {/* Step 1 */}
              <div 
                className="text-white text-center step-item"
                style={{
                  width: '224px',
                  height: '223px'
                }}
              >
                <div className="text-6xl font-bold mb-2">01</div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 500,
                    fontSize: '32px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Connect wallet
                </div>
                <p
                  className="text-white/80"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Link your crypto wallet or create a new one in seconds
                </p>
              </div>

              {/* Step 2 */}
              <div 
                className="text-white text-center step-item"
                style={{
                  width: '224px',
                  height: '223px',
                  opacity: 1,
                  gap: '10px'
                }}
              >
                <div className="text-6xl font-bold mb-2">02</div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 500,
                    fontSize: '32px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Choose currencies
                </div>
                <p
                  className="text-white/80"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Link your crypto wallet or create a new one in seconds
                </p>
              </div>

              {/* Step 3 */}
              <div 
                className="text-white text-center step-item"
                style={{
                  width: '224px',
                  height: '223px'
                }}
              >
                <div className="text-6xl font-bold mb-2">03</div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 500,
                    fontSize: '32px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Send instantly
                </div>
                <p
                  className="text-white/80"
                  style={{
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                  }}
                >
                  Link your crypto wallet or create a new one in seconds
                </p>
              </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Mobile styles */
        @media (max-width: 768px) {
          .how-it-works-container {
            width: 400px !important;
            height: 1185px !important;
            opacity: 1 !important;
            border-radius: 50px !important;
          }
          
          .badge-element {
            width: 253px !important;
            height: 253px !important;
            top: -58px !important;
            left: 260px !important;
            right: auto !important;
            opacity: 0.5 !important;
          }
          
          .steps-container {
            width: 224px !important;
            height: 769px !important;
            top: 248px !important;
            left: 42px !important;
            transform: none !important;
            flex-direction: column !important;
            gap: 50px !important;
            justify-content: flex-start !important;
          }
          
          .step-item {
            width: 224px !important;
            height: 223px !important;
            opacity: 1 !important;
            gap: 10px !important;
          }
          
          .pattern-element {
            width: 224px !important;
            height: 224px !important;
            top: 780px !important;
            left: 259px !important;
            opacity: 0.5 !important;
          }
          
          .header-section {
            width: 260px !important;
            height: 48px !important;
            top: 20px !important;
            left: -10px !important;
            padding-left: 0 !important;
            padding-top: 0 !important;
            opacity: 1 !important;
            gap: 10px !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          .main-heading {
            font-family: SF Pro Rounded !important;
            font-weight: 500 !important;
            font-size: 32px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }
        }
      `}</style>
    </section>
  );
}
