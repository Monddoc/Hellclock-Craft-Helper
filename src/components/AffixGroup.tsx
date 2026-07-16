import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface AffixGroupProps {
  title: string;
  list: React.ReactNode[];
  isSearching: boolean;
  globalCollapseSignal?: number;
  isGlobalCollapsed?: boolean;
}

export const AffixGroup: React.FC<AffixGroupProps> = ({ title, list, isSearching, globalCollapseSignal = 0, isGlobalCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (globalCollapseSignal > 0) {
      setIsCollapsed(isGlobalCollapsed);
    }
  }, [globalCollapseSignal, isGlobalCollapsed]);

  if (list.length === 0 && isSearching) return null;
  if (list.length === 0) return null;

  const actuallyCollapsed = isCollapsed && !isSearching;
  const toggleSection = () => setIsCollapsed(!isCollapsed);

  return (
    <div style={{marginBottom: '3rem'}}>
      <h3 className="affix-group-title" onClick={toggleSection} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span>{title}</span>
        <span style={{ 
          color: 'var(--text-main)', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '8px', 
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease'
        }}>
          {actuallyCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </span>
      </h3>
      <AnimatePresence>
        {!actuallyCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="affix-list" style={{ paddingTop: '1rem' }}>
              <AnimatePresence>
                {list}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
