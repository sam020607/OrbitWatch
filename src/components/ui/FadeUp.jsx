import { motion } from 'framer-motion';

export function FadeUp({
  children, 
  delay = 0, 
  duration = 0.7, 
  y = 24,
  className, 
  style, 
  as = 'div', 
  once = true,
}) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
