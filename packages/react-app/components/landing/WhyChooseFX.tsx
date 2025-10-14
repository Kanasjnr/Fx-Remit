'use client';

export default function WhyChooseFX() {
  return (
    <section className="py-16 bg-white">
      <div className="w-full flex flex-col items-center">
        {/* Section Header */}
        <div
          className="mb-16 why-choose-header"
          style={{
            width: '480px',
            height: '109px',
            gap: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '27px',
              opacity: 1,
              color: '#F18F01',
              fontFamily: 'SF Pro Rounded',
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '150%',
              letterSpacing: '0%',
            }}
          >
            WHY US
          </div>
          <h2
            style={{
              width: '480px',
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
            Why choose FX Remit?
          </h2>
        </div>

        {/* Feature Cards Container */}
        <div className="flex flex-col items-center gap-8 why-choose-cards">
          {/* Top Row - Two side-by-side cards */}
          <div className="flex gap-8 why-choose-top-row">
            {/* Top Left - Send money to 15+ countries */}
            <div
              className="relative why-choose-card-1"
              style={{
                width: '650px',
                height: '403px',
                backgroundColor: '#EAF2FF',
                borderRadius: '50px',
                opacity: 1,
              }}
            >
              <div
                className="absolute why-choose-card-1-content"
                style={{
                  width: '493px',
                  height: '250px',
                  top: '61px',
                  left: '50px',
                  opacity: 1,
                  gap: '25px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  className="why-choose-label"
                  style={{
                    width: '161px',
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
                  Send money to
                </div>
                <div
                  className="why-choose-number"
                  style={{
                    width: '161px',
                    height: '144px',
                    opacity: 1,
                    fontFamily: 'SF Pro Display',
                    fontWeight: 500,
                    fontSize: '96px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#2E5EAA',
                  }}
                >
                  15+
                </div>
                <p
                  className="why-choose-description"
                  style={{
                    width: '493px',
                    height: '54px',
                    opacity: 1,
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#050505',
                  }}
                >
                  countries where you can connect with millions of users around
                  the globe through our expanding network of supported
                  currencies
                </p>
              </div>
            </div>

            {/* Top Right - Instant withdrawal */}
            <div
              className="relative why-choose-card-2"
              style={{
                width: '650px',
                height: '403px',
                backgroundColor: '#EAF2FF',
                borderRadius: '50px',
                opacity: 1,
              }}
            >
              <h3
                className="absolute"
                style={{
                  width: '450px',
                  height: '96px',
                  top: '88px',
                  left: '50px',
                  opacity: 1,
                  fontFamily: 'SF Pro Display',
                  fontWeight: 500,
                  fontSize: '32px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: '#2E5EAA',
                }}
              >
                Instant withdrawal of your funds at any time
              </h3>
            </div>
          </div>

          {/* Bottom Row - Single wide card with illustration */}
          <div
            className="p-8 relative overflow-hidden why-choose-card-3"
            style={{
              width: '1320px',
              height: '400px',
              backgroundColor: '#EAF2FF',
              borderRadius: '50px',
              opacity: 1,
            }}
          >
            {/* Text Content - Left Side */}
            <div
              className="relative z-10"
              style={{
                width: '514px',
                height: '400px',
                opacity: 1,
              }}
            >
              <div
                className="absolute why-choose-card-3-text"
                style={{
                  width: '352px',
                  height: '144px',
                  top: '120px',
                  left: '50px',
                  opacity: 1,
                  gap: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3
                  style={{
                    width: '352px',
                    height: '48px',
                    opacity: 1,
                    fontFamily: 'SF Pro Display',
                    fontWeight: 500,
                    fontSize: '32px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#2E5EAA',
                  }}
                >
                  Ultra low fees
                </h3>
                <p
                  style={{
                    width: '352px',
                    height: '81px',
                    opacity: 1,
                    fontFamily: 'SF Pro Rounded',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#050505',
                  }}
                >
                  Pay only 1.5% compared to traditional services that charge
                  7-10%. Save up to 85% on every transfer.
                </p>
              </div>
            </div>

            {/* Child illustration - Right Side */}
            <div
              className="absolute why-choose-card-3-image"
              style={{
                width: '800px',
                height: '400px',
                top: '0px',
                left: '500px',
                opacity: 1,
              }}
            >
              <img
                src="/child.svg"
                alt="Happy child with smartphone"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Mobile styles */
        @media (max-width: 768px) {
          .why-choose-header {
            width: 350px !important;
            height: 109px !important;
          }

          .why-choose-header h2 {
            width: 350px !important;
            font-size: 36px !important;
          }

          .why-choose-cards {
            flex-direction: column !important;
            gap: 20px !important;
          }

          .why-choose-top-row {
            flex-direction: column !important;
            gap: 20px !important;
          }

          /* First Card Mobile */
          .why-choose-card-1 {
            width: 398px !important;
            height: 432px !important;
            border-radius: 50px !important;
            opacity: 1 !important;
            position: relative !important;
            margin-bottom: 20px !important;
          }

          .why-choose-card-1-content {
            width: 320px !important;
            height: 304px !important;
            top: 64px !important;
            left: 39px !important;
            gap: 25px !important;
            position: absolute !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .why-choose-card-1 .why-choose-description {
            width: 320px !important;
            height: 108px !important;
            font-family: SF Pro Rounded !important;
            font-weight: 400 !important;
            font-size: 18px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }

          .why-choose-card-1 .why-choose-number {
            width: 161px !important;
            height: 144px !important;
            font-family: SF Pro Display !important;
            font-weight: 500 !important;
            font-size: 96px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }

          .why-choose-card-1 .why-choose-label {
            width: 161px !important;
            height: 27px !important;
            font-family: SF Pro Rounded !important;
            font-weight: 400 !important;
            font-size: 18px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }

          /* Second Card Mobile */
          .why-choose-card-2 {
            width: 398px !important;
            height: 403px !important;
            border-radius: 50px !important;
            opacity: 1 !important;
            position: relative !important;
            margin-bottom: 20px !important;
          }

          .why-choose-card-2 h3 {
            width: 326px !important;
            height: 96px !important;
            top: 64px !important;
            left: 36px !important;
            font-family: SF Pro Display !important;
            font-weight: 500 !important;
            font-size: 32px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
            position: absolute !important;
          }

          /* Third Card Mobile */
          .why-choose-card-3 {
            width: 400px !important;
            height: 567px !important;
            border-radius: 50px !important;
            opacity: 1 !important;
            position: relative !important;
            margin-bottom: 20px !important;
          }

          .why-choose-card-3-text {
            width: 320px !important;
            height: 144px !important;
            top: 30px !important;
            left: 30px !important;
            gap: 15px !important;
            position: absolute !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .why-choose-card-3 h3 {
            width: 186px !important;
            height: 48px !important;
            font-family: SF Pro Display !important;
            font-weight: 500 !important;
            font-size: 32px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }

          .why-choose-card-3 p {
            width: 320px !important;
            height: 81px !important;
            font-family: SF Pro Rounded !important;
            font-weight: 400 !important;
            font-size: 18px !important;
            line-height: 150% !important;
            letter-spacing: 0% !important;
          }

          .why-choose-card-3-image {
            width: 535px !important;
            height: 260px !important;
            top: 307px !important;
            left: -110px !important;
            position: absolute !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
