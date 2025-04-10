import { motion } from 'framer-motion';

const FloatingElement = ({ size, color, delay, duration, x, y }) => (
  <motion.div
    className={`absolute rounded-full ${size} ${color} opacity-30 blur-xl`}
    animate={{
      x: [x, x + 100, x],
      y: [y, y - 100, y],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  />
);

export function DynamicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 transition-colors duration-300" />
      
      {/* Floating elements */}
      <FloatingElement
        size="w-64 h-64"
        color="bg-primary-300 dark:bg-primary-700"
        delay={0}
        duration={15}
        x={-32}
        y={100}
      />
      <FloatingElement
        size="w-96 h-96"
        color="bg-secondary-300 dark:bg-secondary-700"
        delay={2}
        duration={20}
        x={200}
        y={300}
      />
      <FloatingElement
        size="w-48 h-48"
        color="bg-primary-200 dark:bg-primary-800"
        delay={1}
        duration={12}
        x={400}
        y={0}
      />
    </div>
  );
}