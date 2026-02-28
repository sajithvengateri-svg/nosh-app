import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Wine, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { palateQuestions } from "../data/palateQuestions";
import { assignCluster, flavorClusters } from "../data/flavorClusters";
import { useWingStore } from "../stores/wingStore";

const WinePalate = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const { setPalateAnswer, setFlavorCluster, completeAssessment } = useWingStore();

  const currentQuestion = palateQuestions[step];
  const isLastStep = step === palateQuestions.length - 1;
  const hasAnswered = currentQuestion && answers[currentQuestion.id];

  const handleSelect = (value: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setPalateAnswer(currentQuestion.id, value);
  };

  const handleNext = () => {
    if (isLastStep && hasAnswered) {
      // Compute cluster
      const cluster = assignCluster(answers);
      setFlavorCluster(cluster);
      completeAssessment();
      setShowResult(true);
      return;
    }
    if (hasAnswered) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleContinue = () => {
    navigate('/wing/lobby');
  };

  // Result screen
  if (showResult) {
    const cluster = assignCluster(answers);
    const clusterData = flavorClusters[cluster];

    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: '#1C1C1C' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="text-6xl mb-6"
          >
            {clusterData.icon}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm uppercase tracking-widest mb-3"
            style={{ color: '#C9A96E' }}
          >
            Your palate profile
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold mb-3"
            style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}
          >
            {clusterData.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg mb-6"
            style={{ color: '#C9A96E' }}
          >
            {clusterData.tagline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm leading-relaxed mb-10"
            style={{ color: '#F5F0EB88' }}
          >
            {clusterData.description}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #D4BA8A)',
              color: '#1C1C1C',
              boxShadow: '0 8px 32px rgba(201,169,110,0.3)',
            }}
          >
            <Sparkles className="w-5 h-5" />
            Enter Your Private Wing
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1C1C1C' }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {palateQuestions.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === step ? '2rem' : '0.5rem',
              background: i <= step ? '#C9A96E' : 'rgba(245,240,235,0.15)',
            }}
          />
        ))}
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <p className="text-sm uppercase tracking-widest mb-2 text-center"
              style={{ color: '#C9A96E' }}>
              Question {step + 1} of {palateQuestions.length}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2"
              style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              {currentQuestion.question}
            </h2>
            <p className="text-sm text-center mb-10" style={{ color: '#F5F0EB66' }}>
              {currentQuestion.subtitle}
            </p>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.value;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(option.value)}
                    className="p-4 rounded-xl text-left transition-all border"
                    style={{
                      background: isSelected ? 'rgba(201,169,110,0.12)' : 'rgba(245,240,235,0.04)',
                      borderColor: isSelected ? '#C9A96E' : 'rgba(245,240,235,0.08)',
                    }}
                  >
                    <span className="text-2xl mb-2 block">{option.icon}</span>
                    <p className="font-semibold mb-0.5" style={{ color: isSelected ? '#C9A96E' : '#F5F0EB' }}>
                      {option.label}
                    </p>
                    <p className="text-xs" style={{ color: '#F5F0EB66' }}>
                      {option.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-6 py-6 max-w-lg mx-auto w-full">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-20"
          style={{ color: '#F5F0EB88' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!hasAnswered}
          className="flex items-center gap-1 px-6 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{
            background: hasAnswered ? '#C9A96E' : 'rgba(201,169,110,0.3)',
            color: '#1C1C1C',
          }}
        >
          {isLastStep ? 'Discover My Palate' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WinePalate;
