import { motion } from 'framer-motion';

export function Logo() {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
        >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="20" height="20" rx="4" className="stroke-cyan-500" strokeWidth="2.5" />
                <path d="M15 20L18.5 23.5L25 17" className="stroke-cyan-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="20" r="18" className="stroke-neutral-800" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
        </motion.div>
    );
}
