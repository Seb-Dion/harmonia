import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const RecentLogs = ({ logs }) => {
  return (
    <motion.section
      className="recent-logs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2>Recently Logged</h2>
      <div className="log-list">
        {logs
          .filter(log => {
            const isValid = log && 
                          log.album && 
                          typeof log.album === 'object' && 
                          log.album.name;
            if (!isValid) {
              console.log('Filtered out invalid log:', log);
            }
            return isValid;
          })
          .map((log) => (
            <motion.div
              key={log.id}
              className="log-item"
              whileHover={{ y: -2 }}
            >
              <div className="log-cover">
                <img
                  src={log.album.image_url || "/default-album-cover.png"}
                  alt={`${log.album.name} cover`}
                />
              </div>
              <div className="log-details">
                <div className="log-header">
                  <h3 className="log-title">{log.album.name}</h3>
                  <div className="log-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < log.rating ? "var(--color-primary)" : "none"}
                        stroke={i < log.rating ? "none" : "currentColor"}
                      />
                    ))}
                  </div>
                </div>
                <p className="log-artist">{log.album.artist}</p>
                <p className="log-date">
                  {new Date(log.listen_date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.section>
  );
};

export default RecentLogs;