// CAPTCHA Component for Login Protection
import React, { useState, useRef, useEffect } from 'react';

// Fix for Vite environment variables
const getEnvVar = (key) => {
  return import.meta.env[key];
};

// Dynamic import for ReCAPTCHA to avoid SSR issues
const ReCAPTCHA = React.lazy(() => {
  try {
    return import('react-google-recaptcha');
  } catch (error) {
    console.warn('ReCAPTCHA not available, using fallback');
    return Promise.resolve({ default: () => null });
  }
});

const Captcha = ({ onVerify, onExpire, resetKey = 0 }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const recaptchaRef = useRef();

  // Site key from environment variables
  const siteKey = getEnvVar('VITE_RECAPTCHA_SITE_KEY') || '6LeIxAcTAAAAAJcZVRqyHh71UMIEbUjQ3Yb2Q5pZ';

  useEffect(() => {
    // Reset CAPTCHA when resetKey changes
    if (resetKey > 0) {
      handleReset();
    }
  }, [resetKey]);

  const handleVerify = (token) => {
    setIsVerified(true);
    setError('');
    setIsLoading(false);
    
    // Pass token to parent component
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleExpire = () => {
    setIsVerified(false);
    setError('CAPTCHA đã hết hạn. Vui lòng thử lại.');
    setIsLoading(false);
    
    // Notify parent component
    if (onExpire) {
      onExpire();
    }
  };

  const handleError = () => {
    setIsVerified(false);
    setError('Không thể tải CAPTCHA. Vui lòng thử lại.');
    setIsLoading(false);
  };

  const handleReset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setIsVerified(false);
    setError('');
    setIsLoading(true);
  };

  return (
    <div className="captcha-container">
      <div className="captcha-wrapper">
        <div className={`captcha-field ${error ? 'error' : ''} ${isVerified ? 'verified' : ''}`}>
          <div className="captcha-label">
            <span className="captcha-required">*</span>
            Xác minh bạn không phải là robot
          </div>
          
          <div className="captcha-widget">
            {isLoading && (
              <div className="captcha-loading">
                <div className="captcha-spinner"></div>
                <span>Đang tải CAPTCHA...</span>
              </div>
            )}
            
            <React.Suspense fallback={
              <div className="captcha-loading">
                <div className="captcha-spinner"></div>
                <span>Đang tải CAPTCHA...</span>
              </div>
            }>
              {ReCAPTCHA && (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  onChange={handleVerify}
                  onExpired={handleExpire}
                  onErrored={handleError}
                  asyncScriptOnLoad={() => setIsLoading(false)}
                  theme="light"
                  size="normal"
                  hl="vi"
                />
              )}
            </React.Suspense>
          </div>
          
          {error && (
            <div className="captcha-error">
              <span className="captcha-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}
          
          {isVerified && (
            <div className="captcha-success">
              <span className="captcha-success-icon">✓</span>
              <span>Xác minh thành công</span>
            </div>
          )}
        </div>
        
        {!isVerified && !isLoading && (
          <div className="captcha-hint">
            <small>
              Vui lòng hoàn thành xác minh CAPTCHA để tiếp tục đăng nhập.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Math CAPTCHA Alternative (for development)
export const MathCaptcha = ({ onVerify, resetKey = 0 }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔢 MathCaptcha - Generating question...');
    generateQuestion();
  }, [resetKey]);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let correctAnswer;
    switch (operation) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '*':
        correctAnswer = num1 * num2;
        break;
      default:
        correctAnswer = num1 + num2;
    }
    
    setQuestion(`${num1} ${operation} ${num2} = ?`);
    setAnswer(correctAnswer.toString());
    setUserAnswer('');
    setIsVerified(false);
    setError('');
  };

  const handleVerify = () => {
    console.log('🔢 MathCaptcha - Verifying answer...');
    console.log('🔢 User answer:', userAnswer);
    console.log('🔢 Correct answer:', answer);
    
    if (userAnswer.trim() === '') {
      console.log('❌ MathCaptcha - Empty answer');
      setError('Vui lòng nhập câu trả lời');
      return;
    }
    
    if (userAnswer.trim() === answer) {
      console.log('✅ MathCaptcha - Answer correct!');
      setIsVerified(true);
      setError('');
      if (onVerify) {
        console.log('🔢 MathCaptcha - Calling onVerify callback');
        onVerify('math-captcha-verified');
      }
    } else {
      console.log('❌ MathCaptcha - Wrong answer');
      setError('Câu trả lời không đúng. Vui lòng thử lại.');
      setUserAnswer('');
    }
  };

  const handleReset = () => {
    console.log('🔄 MathCaptcha - Resetting...');
    generateQuestion();
  };

  return (
    <div className="math-captcha-container">
      <div className="math-captcha-wrapper">
        <div className={`math-captcha-field ${error ? 'error' : ''} ${isVerified ? 'verified' : ''}`}>
          <div className="math-captcha-label">
            <span className="captcha-required">*</span>
            Xác minh bạn không phải là robot
          </div>
          
          <div className="math-captcha-question">
            <span className="question-text">{question}</span>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => {
                console.log('🔢 CAPTCHA input changed:', e.target.value);
                setUserAnswer(e.target.value);
              }}
              placeholder="Nhập câu trả lời"
              className="math-captcha-input"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <button
              type="button"
              onClick={() => {
                console.log('🔢 CAPTCHA verify button clicked');
                handleVerify();
              }}
              className="math-captcha-verify-btn"
              disabled={isVerified}
            >
              {isVerified ? '✓' : 'Xác minh'}
            </button>
          </div>
          
          {error && (
            <div className="math-captcha-error">
              <span className="captcha-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}
          
          {isVerified && (
            <div className="math-captcha-success">
              <span className="captcha-success-icon">✓</span>
              <span>Xác minh thành công</span>
            </div>
          )}
        </div>
        
        <div className="math-captcha-actions">
          <button
            type="button"
            onClick={handleReset}
            className="math-captcha-reset-btn"
            disabled={!isVerified}
          >
            🔄 Câu mới
          </button>
        </div>
      </div>
    </div>
  );
};

// CAPTCHA Validation Hook
export const useCaptchaValidation = () => {
  const [captchaToken, setCaptchaToken] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setIsCaptchaValid(true);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken('');
    setIsCaptchaValid(false);
  };

  const resetCaptcha = () => {
    setCaptchaToken('');
    setIsCaptchaValid(false);
  };

  return {
    captchaToken,
    isCaptchaValid,
    handleCaptchaVerify,
    handleCaptchaExpire,
    resetCaptcha
  };
};

export default Captcha;
