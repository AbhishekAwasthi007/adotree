import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Leaf, Droplets, Recycle, TreePine, Heart, Globe } from 'lucide-react';
import { FloatingParticles } from '../components/FloatingParticles';
import { api } from '../services/api';

export function SustainabilityPage() {
  const [stats, setStats] = useState<{
    trees_protected: number;
    co2_absorbed: string;
    water_conserved: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.trees.getSustainabilityStats()
      .then(data => {
        setStats(data);
      })
      .catch(err => {
        console.error("Failed to load sustainability stats", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <FloatingParticles />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-[var(--deep-forest)] mb-6">
            Our Impact on the Planet
          </h1>
          <p className="text-xl text-[var(--earth-brown)] max-w-3xl mx-auto leading-relaxed">
            Every tree you adopt contributes to a healthier planet. Together, we're building a
            sustainable future, one tree at a time.
          </p>
        </motion.div>

        {/* Impact Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <ImpactCard
            icon={<TreePine className="w-12 h-12" />}
            number={isLoading ? "..." : (stats?.trees_protected?.toLocaleString() || "0")}
            label="Trees Protected"
            description="Living trees under guardian care"
            color="text-[var(--forest-green)]"
          />
          <ImpactCard
            icon={<Globe className="w-12 h-12" />}
            number={isLoading ? "..." : (stats?.co2_absorbed || "0 kg")}
            label="CO₂ Absorbed"
            description="Carbon offset this year"
            color="text-[var(--sky-blue)]"
          />
          <ImpactCard
            icon={<Droplets className="w-12 h-12" />}
            number={isLoading ? "..." : (stats?.water_conserved || "0 liters")}
            label="Water Conserved"
            description="Through sustainable farming"
            color="text-[var(--sunset-orange)]"
          />
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <BenefitCard
            icon={<Leaf />}
            title="Organic Practices"
            description="Natural farming methods that respect the earth."
          />
          <BenefitCard
            icon={<Recycle />}
            title="Zero Waste Farming"
            description="Complete circular economy. Every part of the farm is reused, recycled, and regenerated."
          />
          <BenefitCard
            icon={<Heart />}
            title="Fair Trade"
            description="Farmers receive fair compensation. Your adoption directly supports their livelihood."
          />
          <BenefitCard
            icon={<TreePine />}
            title="Biodiversity Protection"
            description="Each farm is an ecosystem."
          />
        </div>
      </div>
    </div>
  );
}

function ImpactCard({
  icon,
  number,
  label,
  description,
  color,
}: {
  icon: React.ReactNode;
  number: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center"
    >
      <div className={`${color} mb-4 flex justify-center`}>{icon}</div>
      <div className="text-5xl font-bold text-[var(--deep-forest)] mb-2">{number}</div>
      <div className="text-xl font-bold text-[var(--deep-forest)] mb-2">{label}</div>
      <div className="text-[var(--earth-brown)]">{description}</div>
    </motion.div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl"
    >
      <div className="text-[var(--forest-green)] mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-3">{title}</h3>
      <p className="text-[var(--earth-brown)] leading-relaxed">{description}</p>
    </motion.div>
  );
}
