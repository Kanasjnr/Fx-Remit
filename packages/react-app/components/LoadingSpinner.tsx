"use client"

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8">
        {/* Icon Container */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          {/* Main circular icon */}
          <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-xl border-2 md:border-4 border-white">
            <img 
              src="/icon.jpeg" 
              alt="FX Remit" 
              className="w-full h-full object-cover"
              style={{
                animation: 'subtlePulse 3s ease-in-out infinite',
              }}
            />
          </div>
          
          {/* Inner glow ring */}
          <div 
            className="absolute w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-blue-200 opacity-50"
            style={{
              animation: 'pulseRing 2s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Loading text with smooth animation */}
        <div className="flex flex-col items-center space-y-2 md:space-y-3 px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2">
            <span className="text-blue-600 font-semibold text-sm md:text-lg tracking-wide text-center">
              fast, secure, and truly borderless
            </span>
            <div className="flex space-x-1">
              <span 
                className="text-blue-600 font-semibold text-sm md:text-lg"
                style={{
                  animation: 'fadeInOut 1.4s ease-in-out infinite',
                  animationDelay: '0s'
                }}
              >
                .
              </span>
              <span 
                className="text-blue-600 font-semibold text-sm md:text-lg"
                style={{
                  animation: 'fadeInOut 1.4s ease-in-out infinite',
                  animationDelay: '0.2s'
                }}
              >
                .
              </span>
              <span 
                className="text-blue-600 font-semibold text-sm md:text-lg"
                style={{
                  animation: 'fadeInOut 1.4s ease-in-out infinite',
                  animationDelay: '0.4s'
                }}
              >
                .
              </span>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="w-40 md:w-48 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              style={{
                animation: 'progress 2s ease-in-out infinite',
                width: '30%',
              }}
            />
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes subtlePulse {
            0%, 100% {
              transform: scale(1);
              filter: brightness(1);
            }
            50% {
              transform: scale(1.02);
              filter: brightness(1.1);
            }
          }
          
          @keyframes pulseRing {
            0%, 100% {
              transform: scale(1);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.3;
            }
          }
          
          @keyframes fadeInOut {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(300%);
            }
          }
        `
      }} />
    </div>
  )
}

