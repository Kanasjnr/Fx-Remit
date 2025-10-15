'use client';

import { useRouter } from 'next/navigation';

export default function CTAFooter() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/send');
  };

  const handleLearnMore = () => {
    // Handle learn more action
    console.log('Learn more clicked');
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .cta-footer-container {
            width: 100% !important;
            height: 595px !important;
            left: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .cta-footer-bg-image {
            width: 100% !important;
            height: 100% !important;
            top: 0 !important;
            left: 0 !important;
            object-fit: cover !important;
            
          }
          .cta-footer-text {
            width: 100% !important;
            height: 234px !important;
            left: 0 !important;
            top: 50px !important;
            gap: 20px !important;
            align-items: center !important;
          }
          .cta-footer-heading {
            width: 344px !important;
            height: 96px !important;
            font-size: 32px !important;
            text-align: center !important;
          }
          .cta-footer-try-it {
            
            height: 27px !important;
            font-size: 18px !important;
            text-align: center !important;
          }
          .cta-footer-description {
            width: 344px !important;
            height: 81px !important;
            text-align: center !important;
          }
          .cta-footer-buttons {
            width: 100% !important;
            height: 133px !important;
            left: 0 !important;
            top: 370px !important;
            gap: 15px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 20px !important;
          }
          .cta-footer-button {
            width: 280px !important;
            height: 59px !important;
            max-width: 90% !important;
          }
        }
          
      `}</style>
      <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="relative w-full flex justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="relative cta-footer-container"
          style={{
            width: '1400px',
            height: '595px',
            borderRadius: '50px',
            opacity: 1,
            backgroundColor: '#050505',
            left: '70px',
          }}
        >
          {/* Background Pattern - Inside Section */}
          <div className="absolute inset-0 overflow-hidden rounded-[50px]">
            <img
              src="/blend 1.svg"
              alt="Background pattern" 
              className="absolute cta-footer-bg-image"
              style={{
                width: '1639.9649658203125px',
                height: '1551.5006103515625px',
                top: '-478px',
                left: '327px',
                opacity: 1,
              }}
            />
          </div>
          {/* Text Content */}
          <div
            className="absolute flex flex-col items-start justify-center cta-footer-text"
            style={{
              width: '688px',
              height: '255px',
              top: '170px',
              left: '114px',
              gap: '20px',
            }}
          >
            <div
              className="cta-footer-try-it"
              style={{
                height: '27px',
                fontFamily: 'SF Pro Rounded',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#F18F01',
                opacity: 1,
              }}
            >
              TRY IT NOW
            </div>
            <h2
              className="cta-footer-heading"
              style={{
                height: '144px',
                fontFamily: 'SF Pro Rounded',
                fontWeight: 500,
                fontSize: '48px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#FFFFFF',
                opacity: 1,
              }}
            >
              Ready to make global <br /> transactions?
            </h2>
            <p
              className="cta-footer-description"
              style={{
                width: '688px',
                height: '54px',
                fontFamily: 'SF Pro Rounded',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#F5F5F5BF',
                opacity: 1,
              }}
            >
              Join thousands of users who trust FX Remit for fast, secure and
              affordable cross-border payments.
            </p>
          </div>

          {/* CTA Buttons - Separate container */}
          <div
            className="absolute flex flex-col sm:flex-row gap-[10px] justify-center items-center cta-footer-buttons"
            style={{ top: '400px', left: '800px', right: '0px' }}
          >
            <button
              onClick={handleGetStarted}
              className="cta-footer-button"
              style={{
                width: '210px',
                height: '59px',
                borderRadius: '15px',
                paddingTop: '20px',
                paddingRight: '10px',
                paddingBottom: '20px',
                paddingLeft: '10px',
                backgroundColor: '#2E5EAA',
                opacity: 1,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '124px',
                  height: '19px',
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#F8F8FF',
                  opacity: 1,
                }}
              >
                Get started now
              </span>
            </button>
            <button
              onClick={handleLearnMore}
              className="cta-footer-button"
              style={{
                width: '210px',
                height: '59px',
                borderRadius: '15px',
                paddingTop: '20px',
                paddingRight: '10px',
                paddingBottom: '20px',
                paddingLeft: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #F18F01',
                opacity: 1,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '86px',
                  height: '19px',
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#F18F01',
                  opacity: 1,
                }}
              >
                Learn more
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
