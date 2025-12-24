import { Link } from "react-router-dom";
import { useChatNotification } from '../contexts/ChatNotificationContext';
import NotificationBadge from './NotificationBadge';   // 🆕 IMPORT



export default function BottomNav({ active = "IA", onPronosClick, pronosMode = "accueil" }) {
  const { hasUnreadMessages } = useChatNotification();

const EclairIcon = ({ size = 24 }) => (
  <img 
    src="/images/eclair.svg"
    alt="Éclair"
    style={{ width: size, height: size, objectFit: "contain" }}
  />
);


  const items = [
  { key: "IA", label: "Pronos", icon: EclairIcon, to: "/ia", badge: false },
  { key: "Pronos", label: "Paris", icon: TargetIcon, to: "/pronos", badge: false },
  { key: "Classement", label: "Classement", icon: TrophyIcon, to: "/classement", badge: false },
  { key: "Chat", label: "Chat", icon: ChatIcon, to: "/chat", badge: hasUnreadMessages },
  { key: "Plus", label: "Plus", icon: GridIcon, to: "/plus", badge: false },
];


  return (
    <nav className="nav-container">
      <div className="nav-items">

        {items.map(({ key, label, icon: Icon, to, badge }) => {
          const classes = `nav-button ${active === key ? "nav-active" : "nav-inactive"}`;
          const isActive = active === key;

          return (
            <Link
              key={key}
              to={to}
              onClick={key === "IA" ? onPronosClick : undefined}
              className={classes}
            >
              <div className="relative inline-block">
                <Icon className="h-6 w-6" />

                {/* Badge notification - Ballon de rugby rouge */}
                {badge && !isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 animate-pulse">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                      <ellipse 
                        cx="50" 
                        cy="60" 
                        rx="50" 
                        ry="60" 
                        fill="#DC2626"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}

        {/* 🆕 NotificationBadge inséré dans la barre */}
        <NotificationBadge />

      </div>
    </nav>
  );
}



/* ============================
   Icônes SVG inline
============================ */

function BrainIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2M14 4.5a2.5 2.5 0 0 1 5 0c0 .47-.13.92-.36 1.3a2.5 2.5 0 0 1 1.68 3.94 3 3 0 0 1 .22 5.64 2.5 2.5 0 0 1-3.46 2.78A2.5 2.5 0 0 1 12 19.5V4.5" />
    </svg>
  );
}

function TargetIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
    </svg>
  );
}

function LiveIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}
