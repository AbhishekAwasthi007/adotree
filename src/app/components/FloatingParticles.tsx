import { motion } from 'motion/react';

export function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            y: [null, -100, window.innerHeight + 100],
            x: [
              null,
              Math.random() * window.innerWidth * 0.3 - window.innerWidth * 0.15,
            ],
            scale: [0, 1, 1, 0],
            opacity: [0, 0.6, 0.6, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
          className="absolute"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 2C10 2 6 6 6 10C6 12.2091 7.79086 14 10 14C12.2091 14 14 12.2091 14 10C14 6 10 2 10 2Z"
              fill="currentColor"
              className="text-[var(--leaf-green)]"
              opacity="0.3"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
