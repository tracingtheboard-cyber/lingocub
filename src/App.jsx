import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import lionImg from './assets/scout-lion.png';

// --- Sound Engine (Web Audio API) ---
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  
  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'victory') {
    const playNote = (freq, time, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    };
    playNote(523.25, 0, 0.4); 
    playNote(659.25, 0.1, 0.4); 
    playNote(783.99, 0.2, 0.8); 
    playNote(1046.50, 0.3, 1.2); 
  }
};

// --- Premium Cloud TTS Engine (with Browser Fallback) ---
const speakTextWithCallback = async (text, onEndCallback) => {
  try {
    // Attempt to use Premium Cloud TTS
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) throw new Error('Cloud TTS failed');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (onEndCallback) onEndCallback();
    };
    audio.onerror = () => {
      if (onEndCallback) onEndCallback();
    }
    
    await audio.play();
  } catch (error) {
    console.log("Using browser fallback TTS");
    // Fallback to robotic browser TTS if cloud fails or is too slow
    if (!window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }
    window.speechSynthesis.cancel(); 
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.95; 
    utterance.pitch = 1.2; 
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Google UK English Female')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      if (onEndCallback) onEndCallback();
    };
    
    window.speechSynthesis.speak(utterance);
  }
};


const PASSAGES = [
  {
    title: "The Missing Ez-Link Card",
    content: [
      "Raju rummaged frantically through his backpack. The school bell was about to ring, and he was already standing at the bus stop. His precious EZ-Link card, which his mother had just topped up with fifty dollars, was nowhere to be found.",
      "Panic set in as he retraced his steps. Could he have dropped it at the canteen during recess? Or perhaps it slipped out when he was rushing to finish his Science project in the library? He knew one thing for certain: his mother would not be pleased."
    ],
    emojis: {
      topRight: "💳", topLeft: "🎒", bottomRight: "🏫", bottomLeft: "😰", middleRight: "🚌", center: "💳 🎒 😰"
    },
    questions: [
      {
        id: 1,
        text: "Why was Raju feeling frantic?",
        options: ["He was late for his Science class.", "He had lost his Science project.", "He could not find his EZ-Link card.", "He left his backpack at the library."],
        correctIndex: 2,
        successMsg: "Correct! He was frantic because he couldn't find his EZ-Link card."
      },
      {
        id: 2,
        text: "What does the word 'rummaged' suggest about how Raju was searching?",
        options: ["Slowly and carefully", "Hurriedly and messily", "Quietly and calmly", "Angrily and loudly"],
        correctIndex: 1,
        successMsg: "Great job! Rummaging means searching in a hurried or messy way."
      }
    ]
  },
  {
    title: "A Marvel at Jewel Changi",
    content: [
      "As Sarah stepped into Jewel Changi Airport, she gasped in awe. Right in the centre stood the Rain Vortex, the world's tallest indoor waterfall. Water cascaded down dramatically from the glass dome, surrounded by lush green terraces that resembled a magical forest.",
      "Her father explained that the waterfall was not just for show; it actually collected rainwater to be reused in the building. Sarah marvelled at how the architects combined breathtaking beauty with clever eco-friendly technology."
    ],
    emojis: {
      topRight: "✈️", topLeft: "🌿", bottomRight: "💧", bottomLeft: "🌳", middleRight: "😲", center: "💧 🌿 ✈️"
    },
    questions: [
      {
        id: 3,
        text: "What made Sarah gasp in awe when she entered Jewel Changi?",
        options: ["The eco-friendly technology", "The airplanes flying outside", "The magical forest animals", "The massive indoor waterfall"],
        correctIndex: 3,
        successMsg: "Correct! The Rain Vortex is an impressive indoor waterfall."
      },
      {
        id: 4,
        text: "Based on the passage, what is one practical function of the Rain Vortex?",
        options: ["It waters the forest automatically.", "It collects rainwater to be reused.", "It cools down the entire airport.", "It provides drinking water for visitors."],
        correctIndex: 1,
        successMsg: "Excellent! The passage states that it collects rainwater for reuse."
      }
    ]
  }
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedOption, setSelectedOption] = useState(null);
  
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [tutorMessage, setTutorMessage] = useState("Hi! I'm Lele. Let's learn together!");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [childQuestion, setChildQuestion] = useState("");
  
  const [dynamicPassages, setDynamicPassages] = useState(PASSAGES);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [studentGrade, setStudentGrade] = useState('Primary 4');
  
  // Real Database State
  const [userData, setUserData] = useState({
    total_days: 1,
    mastered_skills: 0,
    total_minutes: 0,
    stars: 0
  });

  // Voice Input & Live Mode States
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const recognitionRef = useRef(null);
  const isLiveModeRef = useRef(isLiveMode);
  
  // Fetch user data from Supabase on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', 'lele_001')
          .single();
          
        if (data && !error) {
          setUserData(data);
        }
      } catch (e) {
        console.log("Supabase not set up yet, using local mock data.");
      }
    };
    fetchUserData();
  }, []);

  // Update ref to always have latest value for callbacks
  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
    if (isLiveMode && recognitionRef.current && !isListening && !isAiLoading) {
      try { recognitionRef.current.start(); } catch(e){ /* ignore */ }
    } else if (!isLiveMode && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){ /* ignore */ }
    }
  }, [isLiveMode]);

  // Init Voices and Speech Recognition
  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setChildQuestion(transcript);
        
        // If in live mode, automatically submit!
        if (isLiveModeRef.current) {
          await submitQuestionToAI(transcript);
        }
      };
      
      recognition.onerror = (event) => {
        setIsListening(false);
        // Auto-restart if it just timed out in live mode
        if (isLiveModeRef.current && event.error === 'no-speech') {
          try { recognition.start(); } catch(e){ /* ignore */ }
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleStartLearning = async () => {
    setIsGeneratingStory(true);
    try {
      const response = await fetch('/api/placement-test?grade=' + encodeURIComponent(studentGrade));
      const data = await response.json();
      setDynamicPassages([data]);
      setCurrentPage('quiz');
      setCurrentPassageIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setTutorMessage("Read the passage carefully!");
      window.speechSynthesis?.cancel();
      if(isLiveMode) {
        try { recognitionRef.current?.start(); } catch(e){ /* ignore */ }
      }
    } catch (e) {
      alert("Oops! Failed to load placement test.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleMagicStory = async () => {
    setIsGeneratingStory(true);
    try {
      const response = await fetch('/api/daily-passage?grade=' + encodeURIComponent(studentGrade));
      const data = await response.json();
      setDynamicPassages([data]);
      setCurrentPage('quiz');
      setCurrentPassageIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setTutorMessage("Wow! I just wrote this story for you!");
      window.speechSynthesis?.cancel();
      if(isLiveModeRef.current) {
        try { recognitionRef.current?.start(); } catch(e){ /* ignore */ }
      }
    } catch (e) {
      alert("Oops! Failed to generate story.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleGoHome = () => {
    setCurrentPage('home');
    setSelectedOption(null);
    setIsLiveMode(false); // turn off live mode when going home
    window.speechSynthesis?.cancel();
  };

  const handleViewReport = () => {
    setCurrentPage('report');
  };

  const handleViewParent = () => {
    setCurrentPage('parent');
  };

  const submitQuestionToAI = async (questionText) => {
    if (!questionText.trim()) return;
    
    setIsAiLoading(true);
    setTutorMessage("Hmm, let me see... 💭");
    setChildQuestion(""); // clear input box
    
    // Crucial: Stop listening while AI is thinking/speaking!
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){ /* ignore */ }
    }
    
    const currentPassage = dynamicPassages[currentPassageIndex];
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageText: currentPassage.content.join(" "),
          question: questionText,
          grade: studentGrade
        })
      });
      
      const data = await response.json();
      setTutorMessage(data.reply);
      
      // Speak and wait for completion
      speakTextWithCallback(data.reply, () => {
        setIsAiLoading(false);
        // Once done speaking, if we are still in live mode, start listening again!
        if (isLiveModeRef.current && recognitionRef.current) {
          setTimeout(() => {
            try { recognitionRef.current.start(); } catch(e){ /* ignore */ }
          }, 300); // slight delay to avoid feedback loop
        }
      });
    } catch (e) {
      setTutorMessage("Oops! My connection dropped.");
      speakTextWithCallback("Oops! My connection dropped.", () => {
        setIsAiLoading(false);
        if (isLiveModeRef.current) try { recognitionRef.current?.start(); } catch(err){ /* ignore */ }
      });
    }
  };

  const handleManualAsk = (e) => {
    e.preventDefault();
    if (!childQuestion.trim() || isAiLoading) return;
    submitQuestionToAI(childQuestion);
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
  };

  // Only for manual push-to-talk if Live Mode is OFF
  const handlePushToTalk = () => {
    if (isLiveMode) return; // if live mode is on, it's automatic
    if (!recognitionRef.current) {
      alert("Browser not supported.");
      return;
    }
    try { recognitionRef.current.start(); } catch(e){ /* ignore */ }
  };

  const handleOptionClick = async (optionIndex) => {
    if (selectedOption !== null || isAiLoading) return; 
    
    setSelectedOption(optionIndex);
    
    // Stop listening during test checking
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){ /* ignore */ }
    }
    
    const currentPassage = dynamicPassages[currentPassageIndex];
    const currentQuestion = currentPassage.questions[currentQuestionIndex];
    
    if (optionIndex === currentQuestion.correctIndex) {
      playSound('correct');
      setTutorMessage(currentQuestion.successMsg);
      
      speakTextWithCallback(currentQuestion.successMsg, () => {
        setTimeout(() => {
          if (currentQuestionIndex < currentPassage.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setTutorMessage("You're doing great!");
          } else if (currentPassageIndex < dynamicPassages.length - 1) {
            setCurrentPassageIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
            setSelectedOption(null);
            setTutorMessage("Next passage! Good luck.");
          } else {
            playSound('victory');
            
            // Save real progress to Supabase!
            const newStars = userData.stars + 3;
            const newSkills = userData.mastered_skills + 2;
            setUserData(prev => ({ ...prev, stars: newStars, mastered_skills: newSkills }));
            
            supabase.from('user_progress')
              .update({ stars: newStars, mastered_skills: newSkills })
              .eq('user_id', 'lele_001')
              .then(({error}) => {
                 if (error) console.log("Make sure to run the SQL snippet in Supabase!", error);
                 else console.log("Progress saved to Cloud!");
              });
              
            setCurrentPage('report');
          }
          // Restart live mode if active
          if (isLiveModeRef.current) {
            try { recognitionRef.current?.start(); } catch(e){ /* ignore */ }
          }
        }, 1000); 
      });
    } else {
      playSound('wrong');
      setIsAiLoading(true);
      setTutorMessage("Hmm, let me think... 💭");
      
      try {
        const response = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passageText: currentPassage.content.join(" "),
            questionText: currentQuestion.text,
            childsAnswer: currentQuestion.options[optionIndex],
            grade: studentGrade
          })
        });
        
        const data = await response.json();
        setTutorMessage(data.reply);
        
        speakTextWithCallback(data.reply, () => {
          setIsAiLoading(false);
          setTimeout(() => {
            setSelectedOption(null);
            if (isLiveModeRef.current) {
              try { recognitionRef.current?.start(); } catch(e){ /* ignore */ }
            }
          }, 3000);
        }); 
      } catch (e) {
        const fallbackMsg = "Oops! Not quite. Try looking at the passage again!";
        setTutorMessage(fallbackMsg);
        speakTextWithCallback(fallbackMsg, () => {
          setIsAiLoading(false);
          setSelectedOption(null);
        });
      }
    }
  };

  const currentPassage = dynamicPassages[currentPassageIndex];
  const currentQuestion = currentPassage.questions[currentQuestionIndex];

  const totalQuestions = dynamicPassages.reduce((acc, p) => acc + p.questions.length, 0);
  let questionsCompleted = 0;
  for (let i = 0; i < currentPassageIndex; i++) {
    questionsCompleted += dynamicPassages[i].questions.length;
  }
  questionsCompleted += currentQuestionIndex + 1;

  return (
    <div>
      <nav className="top-nav">
        <div className="nav-left"></div>
        <div className="nav-center">
          <div className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={handleGoHome}>
            <span className="nav-icon">🏠</span> Home
          </div>
          <div className={`nav-item ${currentPage === 'quiz' ? 'active' : ''}`} onClick={handleStartLearning}>
            <span className="nav-icon">📖</span> Test
          </div>
          <div className={`nav-item ${currentPage === 'report' ? 'active' : ''}`} onClick={handleViewReport}>
            <span className="nav-icon">📊</span> Report
          </div>
          <div className={`nav-item ${currentPage === 'parent' ? 'active' : ''}`} onClick={handleViewParent}>
            <span className="nav-icon">👨‍👩‍👧</span> Dashboard
          </div>
        </div>
        <div className="nav-right">
          <span style={{marginRight: '10px', fontSize: '18px', fontWeight: 'bold', color: '#FF7700'}}>
             ⭐ {userData.stars}
          </span>
          <span>🦁</span><span>🐱</span><span>🐶</span>
        </div>
      </nav>

      <div className="landscape">
        <div className="sun"></div>
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="mountain"></div>
        <div className="hill-bg"></div>
        <div className="hill-fg"></div>
        <div className="path"></div>
      </div>

      {currentPage === 'home' && (
        <div className="hero-section">
          <div className="content-wrapper">
            <div className="logo-main">
              <span className="star-icon">🦁</span> LingoCub
            </div>
            <div className="hero-main">
              <div className="text-col text-left">
                <h1 className="main-headline">
                  Dear <span className="highlight">Little Friend</span>,<br/> Welcome to the
                </h1>
                <div className="sub-headline">Get ready to explore the wonderful world with Lele the lion</div>
              </div>
              <div className="center-character">
                <div className="sparkle sp-1">✨</div>
                <div className="sparkle sp-2">⭐</div>
                <div className="sparkle sp-3">✨</div>
                <img src={lionImg} alt="Lele the Lion" className="lion-image" style={{ width: '300px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.2))' }} />
              </div>
              <div className="text-col text-right">
                <h1 className="main-headline"><span className="highlight">wonderful</span> learning paradise!</h1>
                <div className="en-headline">START LEARNING NOW!</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontFamily: 'var(--font-en)', fontWeight: 'bold', fontSize: '20px', color: '#1E4663' }}>Select Level:</span>
              <select 
                value={studentGrade} 
                onChange={(e) => setStudentGrade(e.target.value)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: '3px solid #3B82D1',
                  fontFamily: 'var(--font-zh)',
                  fontSize: '20px',
                  color: '#1E4663',
                  backgroundColor: '#E4F7FA',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Kindergarten 1">K1 (Age 5)</option>
                <option value="Kindergarten 2">K2 (Age 6)</option>
                <option value="Primary 1">Primary 1</option>
                <option value="Primary 2">Primary 2</option>
                <option value="Primary 3">Primary 3</option>
                <option value="Primary 4">Primary 4</option>
                <option value="Primary 5">Primary 5</option>
                <option value="Primary 6">Primary 6</option>
                <option value="Secondary 1">Secondary 1</option>
                <option value="Secondary 2">Secondary 2</option>
              </select>
            </div>

            <div className="action-area" style={{ flexDirection: 'row', gap: '30px' }}>
              <button className="play-btn" onClick={handleStartLearning}>
                <span className="btn-main-text" style={{ fontSize: '36px' }}>Start Placement Test</span>
                <span className="btn-sub-text">Classic Mode ➔</span>
              </button>
              <button 
                className="play-btn" 
                onClick={handleMagicStory}
                disabled={isGeneratingStory}
                style={{ 
                  background: 'linear-gradient(180deg, #E4F7FA 0%, #A0D8EF 100%)',
                  boxShadow: '0 15px 25px rgba(59, 130, 209, 0.4), inset 0 -8px 20px rgba(59, 130, 209, 0.5), inset 0 8px 20px rgba(255, 255, 255, 0.7)',
                  border: '8px solid #FFFFFF'
                }}
              >
                <span className="btn-main-text" style={{ fontSize: '36px', color: '#1E4663', textShadow: '0 4px 6px rgba(255, 255, 255, 0.8)' }}>
                  {isGeneratingStory ? "Generating..." : "✨ Daily Magic Story"}
                </span>
                <span className="btn-sub-text" style={{ color: '#3B82D1' }}>
                  {isGeneratingStory ? "Writing a new adventure..." : "AI Generated for You ➔"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'quiz' && (
        <div className="quiz-container">
          <div className="article-panel">
            <h1 className="book-title" style={{ fontSize: '32px' }}>
              <span className="highlight-teal">{currentPassage.title}</span>
              <span style={{position:'absolute', right:'-20px', top:'10px', fontSize:'30px'}}>{currentPassage.emojis.topRight}</span>
              <span style={{position:'absolute', left:'-20px', top:'20px', fontSize:'30px'}}>{currentPassage.emojis.topLeft}</span>
            </h1>
            <div className="article-content">
              {currentPassage.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '50px' }}>
                {currentPassage.emojis.center}
              </div>
            </div>
            <div style={{position:'absolute', bottom:'30px', right:'30px', fontSize:'40px'}}>{currentPassage.emojis.bottomRight}</div>
            <div style={{position:'absolute', bottom:'20px', left:'30px', fontSize:'40px'}}>{currentPassage.emojis.bottomLeft}</div>
            <div style={{position:'absolute', top:'150px', right:'10px', fontSize:'40px'}}>{currentPassage.emojis.middleRight}</div>
          </div>

          <div className="quiz-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ color: '#FF7700', fontWeight: 'bold' }}>
                Question {questionsCompleted} of {totalQuestions}
              </div>
              <div style={{ background: '#E4F7FA', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#3B82D1' }}>
                Passage {currentPassageIndex + 1}
              </div>
            </div>
            
            <h2 className="question-text" style={{ fontSize: '28px', lineHeight: '1.4' }}>
              {currentQuestion.id}. {currentQuestion.text}
            </h2>
            
            <div className="options-list">
              {currentQuestion.options.map((opt, i) => {
                const colors = ['blue', 'green', 'yellow', 'red'];
                const hexColors = ['#3B82D1', '#4FA323', '#F39C12', '#D8422A'];
                const letters = ['A', 'B', 'C', 'D'];
                return (
                  <button 
                    key={i}
                    className={`glossy-btn btn-${colors[i]}`} 
                    onClick={() => handleOptionClick(i)}
                    style={{ opacity: selectedOption !== null && selectedOption !== i ? 0.6 : 1 }}
                  >
                    <span className="option-num" style={{ color: hexColors[i] }}>{letters[i]}</span>
                    <span className="option-text">{opt}</span>
                  </button>
                )
              })}
            </div>
            
            <div className="ai-teacher-widget">
              <div className="chat-bubble-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '80px', marginRight: '10px' }}>
                
                {/* Live Mode Toggle */}
                <button 
                  onClick={toggleLiveMode}
                  style={{
                    marginBottom: '10px',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    background: isLiveMode ? '#FF4B4B' : '#E4F7FA',
                    color: isLiveMode ? 'white' : '#3B82D1',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s'
                  }}
                >
                  🎧 {isLiveMode ? 'Live Tutor: ON' : 'Live Tutor: OFF'}
                </button>

                <div className="chat-bubble" style={{ 
                  opacity: isAiLoading ? 0.7 : 1, 
                  transition: 'opacity 0.3s',
                  whiteSpace: 'normal',
                  maxWidth: '280px',
                  fontSize: '18px',
                  lineHeight: '1.4',
                  marginBottom: '0',
                  marginRight: '0'
                }}>
                  {isAiLoading ? "Hmm... 💭" : tutorMessage}
                </div>
                
                <form onSubmit={handleManualAsk} style={{ marginTop: '10px', display: 'flex', gap: '5px', width: '100%', maxWidth: '320px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={handlePushToTalk}
                    style={{ 
                      background: (isListening || isLiveMode) ? '#FF4B4B' : '#E4F7FA', 
                      color: (isListening || isLiveMode) ? 'white' : '#3B82D1', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '38px', 
                      height: '38px', 
                      cursor: isLiveMode ? 'default' : 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      fontSize: '18px',
                      transition: 'all 0.3s',
                      flexShrink: 0
                    }}
                    title={isLiveMode ? "Listening automatically..." : "Hold to speak"}
                    disabled={isAiLoading || isLiveMode}
                  >
                    🎤
                  </button>
                  <input 
                    type="text" 
                    value={childQuestion}
                    onChange={(e) => setChildQuestion(e.target.value)}
                    placeholder={isListening ? "I'm listening..." : "Ask Lele..."}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '2px solid #D68D57', outline: 'none', fontFamily: 'var(--font-en)' }}
                    disabled={isAiLoading || isLiveMode}
                  />
                  <button 
                    type="submit" 
                    style={{ background: '#D68D57', color: 'white', border: 'none', borderRadius: '20px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}
                    disabled={isAiLoading || isLiveMode}
                  >
                    Ask
                  </button>
                </form>
              </div>

              <div className="teacher-avatar-container">
                <img src={lionImg} alt="Tutor Lele" className="tutor-lion-image" style={{ width: '180px', height: 'auto', objectFit: 'contain', position: 'absolute', bottom: '0', right: '-20px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))', animation: 'bounce 3s infinite' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'report' && (
        <div className="report-container">
          <div className="report-card">
            <div className="report-header">
              <div className="trophy-icon">🏆</div>
              <h2 className="report-title">Today you mastered these skills</h2>
            </div>
            <div className="skills-list">
              <div className="skill-item">
                <div className="skill-info">
                  <span className="skill-name">📖 Reading Ability</span>
                  <span className="skill-score">85%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar fill-blue" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="skill-item">
                <div className="skill-info">
                  <span className="skill-name">📝 Vocabulary</span>
                  <span className="skill-score">100%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar fill-orange" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            <div className="reward-section">
              <p className="reward-text">Awesome! You have {userData.stars} stars in total!</p>
              <div className="stars-container">
                <span className="star-pop">⭐</span>
                <span className="star-pop">⭐</span>
                <span className="star-pop">⭐</span>
              </div>
              <button className="primary-btn-small" onClick={handleGoHome}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'parent' && (
        <div className="dashboard-container">
          <div className="profile-section">
            <div className="avatar-ring">
              <div className="avatar-inner">👦🏻</div>
            </div>
            <div className="profile-info">
              <h2>Lele</h2>
              <p>ID: 88992233 • Grade 1</p>
            </div>
          </div>
          <div className="cards-grid">
            <div className="dashboard-card card-blue">
              <div className="card-header">
                <div className="card-icon">🗓️</div>
                <div className="card-title">Total Learning Days</div>
              </div>
              <div className="card-value">{userData.total_days} <span style={{fontSize: '24px', color: '#888'}}>Days</span></div>
            </div>
            <div className="dashboard-card card-orange">
              <div className="card-header">
                <div className="card-icon">🎯</div>
                <div className="card-title">Mastered Skills</div>
              </div>
              <div className="card-value">{userData.mastered_skills} <span style={{fontSize: '24px', color: '#888'}}>Skills</span></div>
            </div>
            <div className="dashboard-card card-blue">
              <div className="card-header">
                <div className="card-icon">⏱️</div>
                <div className="card-title">Weekly Learning Time</div>
              </div>
              <div className="card-value">
                {Math.floor(userData.total_minutes / 60)} <span style={{fontSize: '24px', color: '#888'}}>Hours</span> {userData.total_minutes % 60} <span style={{fontSize: '24px', color: '#888'}}>Mins</span>
              </div>
            </div>
            <div className="dashboard-card card-orange">
              <div className="card-header">
                <div className="card-icon">📈</div>
                <div className="card-title">Recent 7-Day Activity</div>
              </div>
              <div className="chart-container">
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '30%'}}></div>
                  <div className="chart-label">Mon</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '50%'}}></div>
                  <div className="chart-label">Tue</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-label" style={{color: '#CCC'}}>-</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '80%'}}></div>
                  <div className="chart-label">Thu</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '100%'}}></div>
                  <div className="chart-label">Fri</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '40%'}}></div>
                  <div className="chart-label">Sat</div>
                </div>
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{height: '60%'}}></div>
                  <div className="chart-label">Sun</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
