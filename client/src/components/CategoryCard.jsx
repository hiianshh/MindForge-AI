import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryCard({ category, index, onSelect, disabled }) {
  const Icon = category.icon;
  return (
    <motion.button
      className="category-card"
      onClick={() => onSelect(category.name)}
      disabled={disabled}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.36 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
    >
      <span className="category-icon" style={{ '--category-accent': category.color }}><Icon size={21} /></span>
      <span className="category-copy"><strong>{category.name}</strong><small>{category.short}</small></span>
      <ArrowUpRight size={16} className="category-arrow" />
    </motion.button>
  );
}