import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { TreePine, Play, Users, Leaf, Heart, Globe, ArrowRight, Sprout } from 'lucide-react';
import { FloatingParticles } from '../components/FloatingParticles';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)]">
      <FloatingParticles />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--cream-white)]" />
          <img
            src="https://images.unsplash.com/photo-1654650918251-a3340cfe227b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920"
            alt="Orchard at sunrise"
            className="w-full h-full object-cover opacity-40"
          />
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(82, 183, 136, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(244, 162, 97, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(82, 183, 136, 0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Sprout className="w-16 h-16 text-[var(--forest-green)] mx-auto" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold text-[var(--deep-forest)] mb-6 leading-tight"
          >
            Adopt a Living Tree.
            <br />
            <span className="text-[var(--forest-green)]">Watch It Grow.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-[var(--earth-brown)] mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Build a lifelong connection with nature and support real farmers.
            Receive real harvests from your tree.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(27, 67, 50, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-lg font-medium rounded-full shadow-2xl flex items-center gap-3 group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"
                  whileHover={{ scale: 1.5 }}
                />
                <TreePine className="w-5 h-5" />
                Adopt Your Tree
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-white/80 backdrop-blur-sm text-[var(--forest-green)] text-lg font-medium rounded-full shadow-xl flex items-center gap-3 border-2 border-[var(--forest-green)]/20"
              >
                <Play className="w-5 h-5" />
                Explore Live Farms
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <StatCard number="12,453" label="Trees Adopted" icon={<TreePine />} />
            <StatCard number="847" label="Active Farms" icon={<Globe />} />
            <StatCard number="9,821" label="Tree Guardians" icon={<Users />} />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[var(--forest-green)] rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-[var(--forest-green)] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-[var(--deep-forest)] mb-6">
              Your Journey Starts Here
            </h2>
            <p className="text-xl text-[var(--earth-brown)] max-w-2xl mx-auto">
              From adoption ceremony to harvest delivery, experience the magic of nurturing life
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="01"
              title="Adopt Your Tree"
              description="Choose from mango, apple, orange, and more. Name your tree in a beautiful digital ceremony."
              icon={<TreePine />}
              delay={0}
            />
            <StepCard
              number="02"
              title="Watch It Grow"
              description="Track real-time growth with live farm updates, photos, and weather conditions."
              icon={<Heart />}
              delay={0.2}
            />
            <StepCard
              number="03"
              title="Receive Harvest"
              description="Get premium organic fruits delivered from your own tree, season after season."
              icon={<Leaf />}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Featured Trees */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-[var(--light-sage)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-[var(--deep-forest)] mb-6">
              Meet Your Future Tree
            </h2>
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-[var(--forest-green)] font-medium flex items-center gap-2 mx-auto"
              >
                View All Trees
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <TreeCard
              image="https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600"
              name="Royal Mango"
              location="Kerala, India"
              price="₹4,999"
              yield="15-20 kg/season"
            />
            <TreeCard
              image="https://images.unsplash.com/photo-1628486930648-fed98c4d56cb?w=600"
              name="Himalayan Apple"
              location="Himachal Pradesh"
              price="₹6,999"
              yield="25-30 kg/season"
            />
            <TreeCard
              image="https://images.unsplash.com/photo-1667559794596-27c6019ba5b6?w=600"
              name="Valencia Orange"
              location="Nagpur, Maharashtra"
              price="₹3,999"
              yield="30-35 kg/season"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-[var(--forest-green)] to-[var(--leaf-green)] blur-3xl"
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center bg-white/90 backdrop-blur-xl rounded-[3rem] p-16 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-[var(--deep-forest)] mb-6">
              Ready to Become a Tree Guardian?
            </h2>
            <p className="text-xl text-[var(--earth-brown)] mb-10">
              Join thousands of nature lovers building emotional connections with living trees
            </p>
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(27, 67, 50, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-xl font-medium rounded-full shadow-2xl"
              >
                Start Your Journey
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="text-center bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
    >
      <div className="text-[var(--forest-green)] mb-2 flex justify-center">{icon}</div>
      <div className="text-4xl font-bold text-[var(--deep-forest)] mb-2">{number}</div>
      <div className="text-sm text-[var(--earth-brown)]">{label}</div>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="relative bg-white rounded-3xl p-8 shadow-xl"
    >
      <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-[var(--forest-green)] to-[var(--leaf-green)] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
        {number}
      </div>
      <div className="text-[var(--forest-green)] mb-4 mt-4">{icon}</div>
      <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-3">{title}</h3>
      <p className="text-[var(--earth-brown)] leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TreeCard({
  image,
  name,
  location,
  price,
  yield: yieldAmount,
}: {
  image: string;
  name: string;
  location: string;
  price: string;
  yield: string;
}) {
  return (
    <Link to="/explore">
      <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        className="bg-white rounded-3xl overflow-hidden shadow-xl group cursor-pointer"
      >
        <div className="relative overflow-hidden aspect-[4/3]">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-2">{name}</h3>
          <p className="text-[var(--earth-brown)] mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {location}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--earth-brown)]">Expected Yield</div>
              <div className="font-bold text-[var(--forest-green)]">{yieldAmount}</div>
            </div>
            <div className="text-2xl font-bold text-[var(--deep-forest)]">{price}</div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
