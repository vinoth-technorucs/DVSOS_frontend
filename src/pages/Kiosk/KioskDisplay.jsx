import { useState, useEffect } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Grid } from '@mui/material';
import {
  Car,
  Clock,
  Wrench,
  CheckCircle2,
  LogOut,
  Maximize,
  ClipboardList,
  User,
  Activity,
  Paintbrush,
  Droplets,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Kiosk.module.css';
import { ROUTES } from '../../config/routes';
import useAuthStore from '../../store/useAuthStore';
import { getFirstReadablePath } from '../../utils/authAccess';
import { useTvKioskDashboard } from '../../queries/useDashboardQueries';
import { useSocket } from '../../hooks/useSocket';
import { formatWaitTime } from '../../utils/formatters';

const formatReadyTime = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function useAutoScroll(items, maxVisible = 4, intervalMs = 3000) {
  const [displayItems, setDisplayItems] = useState(items);

  const itemsKey = items.map((i) => i.id).join(',');

  useEffect(() => {
    setDisplayItems(items);
  }, [itemsKey]);

  useEffect(() => {
    if (items.length <= maxVisible) return;

    const interval = setInterval(() => {
      setDisplayItems((prev) => {
        if (prev.length <= 1) return prev;
        const next = [...prev];
        const first = next.shift();
        next.push(first);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items.length, maxVisible, intervalMs]);

  return displayItems;
}

const getStageMeta = (column) => {
  switch (column) {
    case 'BODY_SHOP':
      return {
        label: 'Body Shop',
        icon: Paintbrush,
        itemClass: styles.itemBody,
        chipClass: styles.stageChipBody,
      };
    case 'WATER_WASH':
      return {
        label: 'Water Wash',
        icon: Droplets,
        itemClass: styles.itemWash,
        chipClass: styles.stageChipWash,
      };
    case 'MECHANICAL':
    default:
      return {
        label: 'Mechanical',
        icon: Wrench,
        itemClass: styles.itemMech,
        chipClass: styles.stageChipMech,
      };
  }
};

export default function KioskDisplay() {
  const navigate = useNavigate();
  const { menus, isAuthenticated } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [readyParent] = useAutoAnimate({ duration: 800, easing: 'ease-in-out' });
  const [trackingParent] = useAutoAnimate({ duration: 800, easing: 'ease-in-out' });

  const [searchParams] = useSearchParams();
  const kioskKey = searchParams.get('kioskKey') || undefined;
  const { data: rawJobs, refetch, isError, error } = useTvKioskDashboard({ kioskKey });

  const rawData = rawJobs?.data || rawJobs;
  const jobs = Array.isArray(rawData?.queue)
    ? rawData.queue
    : Array.isArray(rawData)
    ? rawData
    : [];

  useSocket({
    jobCardStatusChanged: (data) => {
      console.log('Live update received:', data);
      refetch();
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      refetch(); // Polling backup every minute to update wait times
    }, 60000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Active in-service jobs (Mechanical, Body Shop, Water Wash)
  const activeJobs = jobs
    .filter((j) => j.column !== 'READY_FOR_DELIVERY')
    .map((j) => ({
      id: j.id,
      vehicle: j.vehicleNumber,
      model: j.vehicleInfo,
      waitTime: formatWaitTime(j.waitMinutes),
      customerName: j.customerName,
      column: j.column,
      status: j.status,
      updatedAt: j.updatedAt,
    }));

  const mechCount = jobs.filter((j) => j.column === 'MECHANICAL').length;
  const bodyCount = jobs.filter((j) => j.column === 'BODY_SHOP').length;
  const washCount = jobs.filter((j) => j.column === 'WATER_WASH').length;

  // Ready for Delivery jobs
  const ready = jobs
    .filter((j) => j.column === 'READY_FOR_DELIVERY')
    .map((j) => ({
      id: j.id,
      vehicle: j.vehicleNumber,
      model: j.vehicleInfo,
      time: formatReadyTime(j.updatedAt),
      customerName: j.customerName,
    }));

  const animatedActive = useAutoScroll(activeJobs, 4, 3500);
  const animatedReady = useAutoScroll(ready, 4, 3500);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const exitKiosk = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(isAuthenticated ? getFirstReadablePath(menus, ROUTES.PROFILE) : ROUTES.LOGIN);
  };

  if (isError && (error?.response?.status === 401 || error?.response?.status === 403 || !kioskKey)) {
    return (
      <div
        className={styles.container}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#1e293b',
            borderRadius: '24px',
            maxWidth: '600px',
            color: '#fff',
            border: '1px solid #334155',
          }}
        >
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 800 }}>
            ⚠️ TV Display Unauthorized
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#e2e8f0' }}>
            {error?.response?.data?.message || 'TV Kiosk API Key is missing, expired, or revoked.'}
          </p>
          <p style={{ fontSize: '1rem', opacity: 0.7 }}>
            Please contact the IT Admin team for the updated Location URL bookmark (e.g. <code>?kioskKey=...</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Car size={28} />
          </div>
          <div>
            <h1 className={styles.brandName}>DVSOS Live Status</h1>
            <p className={styles.brandSub}>Vehicle Service Operations Center</p>
          </div>
        </div>

        <div className={styles.controlsGroup}>
          <div className={styles.clockRight}>
            <div className={styles.clockDate}>
              {time.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className={styles.clockTime}>
              {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          </div>
          <button className={styles.fsBtn} onClick={toggleFullscreen} title="Toggle Fullscreen">
            <Maximize size={22} />
          </button>
          <button className={styles.exitBtn} onClick={exitKiosk} title="Exit Kiosk">
            <LogOut size={20} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Grid — Left: Live Status Tracking, Right: Ready to Delivery */}
      <div className={styles.grid}>
        <Grid container spacing={{ xs: 1.5, md: 2, lg: 3 }} sx={{ height: { xs: 'auto', lg: '100%' } }}>
          {/* Left Column: Live Status Tracking */}
          <Grid
            item
            xs={12}
            sm={6}
            lg={6}
            sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}
          >
            <div className={`${styles.section} ${styles.trackingSection}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <div className={styles.sectionTitle}>
                    <Activity size={24} className={styles.livePulseIcon} /> Live Status Tracking
                  </div>
                  <div className={styles.stagePillsGroup}>
                    <span className={`${styles.stagePillBadge} ${styles.stagePillMech}`}>
                      Mech: {mechCount}
                    </span>
                    <span className={`${styles.stagePillBadge} ${styles.stagePillBody}`}>
                      Body: {bodyCount}
                    </span>
                    <span className={`${styles.stagePillBadge} ${styles.stagePillWash}`}>
                      Wash: {washCount}
                    </span>
                  </div>
                </div>
                <span className={styles.countBadge}>{activeJobs.length}</span>
              </div>

              <div className={styles.list} ref={trackingParent}>
                {animatedActive.map((item) => {
                  const stage = getStageMeta(item.column);
                  const StageIcon = stage.icon;

                  return (
                    <div key={item.id} className={`${styles.listItem} ${stage.itemClass}`}>
                      <div className={styles.cardHeader}>
                        <span className={styles.jobId}>
                          <ClipboardList size={14} /> {item.id}
                        </span>
                        <div className={styles.cardHeaderRight}>
                          <span className={`${styles.stageChip} ${stage.chipClass}`}>
                            <StageIcon size={13} /> {stage.label}
                          </span>
                          <span className={styles.timeBadge}>
                            <Clock size={14} /> {item.waitTime}
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.plateRow}>
                          <div className={styles.licensePlate}>
                            <div className={styles.plateInd}>
                              <div className={styles.indFlag}>
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              IND
                            </div>
                            <span className={styles.plateText}>{item.vehicle}</span>
                          </div>
                          {item.model && item.model !== 'Unknown' && (
                            <div className={styles.modelTag}>
                              <Car size={16} />
                              <span>{item.model}</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.bottomRow}>
                          <div className={styles.customerDetails}>
                            <div className={styles.userAvatar}>
                              <User size={18} />
                            </div>
                            <h3 className={styles.customerName}>{item.customerName}</h3>
                          </div>
                          <div className={styles.carBadge}>
                            <StageIcon size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeJobs.length === 0 && (
                  <div className={styles.empty}>No vehicles currently in service</div>
                )}
              </div>
            </div>
          </Grid>

          {/* Right Column: Ready to Delivery */}
          <Grid
            item
            xs={12}
            sm={6}
            lg={6}
            sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}
          >
            <div className={`${styles.section} ${styles.readySection}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <CheckCircle2 size={24} /> Ready to Delivery
                </div>
                <span className={styles.countBadge}>{ready.length}</span>
              </div>

              <div className={styles.list} ref={readyParent}>
                {animatedReady.map((item) => (
                  <div key={item.id} className={styles.listItem}>
                    <div className={styles.cardHeader}>
                      <span className={styles.jobId}>
                        <ClipboardList size={14} /> {item.id}
                      </span>
                      <span className={styles.timeBadge}>
                        <Clock size={14} /> Since {item.time}
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.plateRow}>
                        <div className={styles.licensePlate}>
                          <div className={styles.plateInd}>
                            <div className={styles.indFlag}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            IND
                          </div>
                          <span className={styles.plateText}>{item.vehicle}</span>
                        </div>
                        {item.model && item.model !== 'Unknown' && (
                          <div className={styles.modelTag}>
                            <Car size={16} />
                            <span>{item.model}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.bottomRow}>
                        <div className={styles.customerDetails}>
                          <div className={styles.userAvatar}>
                            <User size={18} />
                          </div>
                          <h3 className={styles.customerName}>{item.customerName}</h3>
                        </div>
                        <div className={styles.carBadge}>
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ready.length === 0 && (
                  <div className={styles.empty}>No vehicles ready for delivery</div>
                )}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}

