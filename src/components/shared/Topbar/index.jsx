import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, Menu as MenuIcon, PanelLeftClose, PanelLeft, FileText, Truck, AlertCircle, Info, } from "lucide-react";
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Menu, MenuItem, Divider, ListItemIcon, ListItemText, useTheme, useMediaQuery, Tooltip } from "@mui/material";
import useAuthStore from "../../../store/useAuthStore";
import useUIStore from "../../../store/useUIStore";
import { ROUTES } from "../../../config/routes";
import { getMeApi } from "../../../api/authApi";
import { getNotificationsApi, getUnreadNotificationCountApi, markNotificationReadApi, markAllNotificationsReadApi, } from "../../../api/notificationApi";
import { removeRegisteredDeviceToken, requestNotificationPermissionAndRegister, setupForegroundMessageListener, } from "../../../config/firebase";
import { toastInfo } from "../../../notifications/toast";
import { usePermissions } from "../../../hooks/usePermissions";
import { socket, connectSocket } from "../../../socket/socket";
import WhatsAppChatDrawer from "../../chat/WhatsAppChatDrawer";
import { getRecentChatsApi } from "../../../api/chatApi";
const getNotificationIcon = (type) => {
  const t = String(type || "").toUpperCase();
  if (t.includes("JOB") || t.includes("ASSIGN") || t.includes("WORK")) {
    return <FileText size={18} color="#3B82F6" style={{ marginTop: 2 }} />;
  }
  if (t.includes("GATE") || t.includes("VEHICLE")) {
    return <Truck size={18} color="#10B981" style={{ marginTop: 2 }} />;
  }
  if (t.includes("DELAY") || t.includes("WARN") || t.includes("ERROR")) {
    return <AlertCircle size={18} color="#EF4444" style={{ marginTop: 2 }} />;
  }
  return <Info size={18} color="#64748B" style={{ marginTop: 2 }} />;
};

export default function Topbar() {
  const theme = useTheme();
  const isLaptop = useMediaQuery("(max-width: 1366px)");
  const { user, role, logout, setUser, setMenus } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarMobileOpen } =
    useUIStore();
  const [userHasToggled, setUserHasToggled] = useState(false);
  const [lastCollapsedVal, setLastCollapsedVal] = useState(sidebarCollapsed);

  useEffect(() => {
    if (sidebarCollapsed !== lastCollapsedVal) {
      setUserHasToggled(true);
      setLastCollapsedVal(sidebarCollapsed);
    }
  }, [sidebarCollapsed, lastCollapsedVal]);

  const effectiveCollapsed = sidebarCollapsed || (isLaptop && !userHasToggled);

  const navigate = useNavigate();
  const location = useLocation();
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [userAnchorEl, setUserAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // User location and Admin role check
  const roleName = String(role || user?.role?.slug || user?.role?.name || "").toLowerCase().replace(/[-_\s]+/g, "");
  const isAdmin = roleName === "admin" || roleName === "superadmin";
  const userLocationId = user?.locationId || user?.location_id || user?.branchId || null;

  // WhatsApp Chat Hub state
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);
  const [whatsAppUnreadCount, setWhatsAppUnreadCount] = useState(0);

  const fetchWhatsAppUnreadCount = async () => {
    if (isAdmin) return;
    try {
      const res = await getRecentChatsApi({
        limit: 1,
        ...(userLocationId ? { locationId: userLocationId } : {})
      });
      const data = res?.data?.data || res?.data || {};
      if (typeof data.totalUnreadCount === "number") {
        setWhatsAppUnreadCount(data.totalUnreadCount);
      }
    } catch (err) {
      // Quiet fail if not supported or network error
    }
  };

  const { canRead } = usePermissions();
  const canReadNotifications = canRead("/notifications") || roleName === "cashier";

  const fetchUnreadCount = async () => {
    if (!canReadNotifications) return;
    try {
      const response = await getUnreadNotificationCountApi();
      if (response?.success) {
        setUnreadCount(response.data?.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!canReadNotifications) return;
    try {
      const response = await getNotificationsApi({
        unreadOnly: true,
        limit: 10,
      });
      if (response?.success) {
        const list = response.data?.notifications || [];
        const mapped = list.map((n) => {
          const date = new Date(n.createdAt);
          const timeStr = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            ...n,
            text: n.message ? `${n.title}: ${n.message}` : n.title,
            time: timeStr,
            read: n.readAt !== null,
          };
        });
        setNotifications(mapped);
      }
      await fetchUnreadCount();
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getMeApi();
        if (response?.success) {
          const fetchedUser = response.data.user || response.data;
          setUser(fetchedUser);
          setMenus(response.data.menus || []);
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };
    fetchUserDetails();
  }, [setUser, setMenus]);

  // Refresh notification badge when socket events arrive
  useEffect(() => {
    const handleRefresh = () => {
      if (canReadNotifications) {
        fetchNotifications();
      }
    };

    socket.on("notification-created", handleRefresh);
    socket.on("notification-read", handleRefresh);
    socket.on("notification-read-all", handleRefresh);

    return () => {
      socket.off("notification-created", handleRefresh);
      socket.off("notification-read", handleRefresh);
      socket.off("notification-read-all", handleRefresh);
    };
  }, [canReadNotifications]);

  // WhatsApp chats unread count sync and live socket events
  useEffect(() => {
    if (!user || isAdmin) return;

    fetchWhatsAppUnreadCount();

    if (socket) {
      const handleChatSync = (payload) => {
        // If payload has locationId and user has locationId, verify match
        if (payload?.locationId && userLocationId && String(payload.locationId) !== String(userLocationId)) {
          return;
        }
        fetchWhatsAppUnreadCount();
      };

      socket.on("chat:updated", handleChatSync);
      socket.on("chat:new_message", handleChatSync);
      socket.on("chat:unread_cleared", handleChatSync);
      socket.on("chat:read", handleChatSync);

      return () => {
        socket.off("chat:updated", handleChatSync);
        socket.off("chat:new_message", handleChatSync);
        socket.off("chat:unread_cleared", handleChatSync);
        socket.off("chat:read", handleChatSync);
      };
    }
  }, [user, isAdmin, userLocationId]);

  // Notification polling + Firebase — only for users who can read notifications
  useEffect(() => {
    if (user && canReadNotifications) {
      fetchNotifications();
      requestNotificationPermissionAndRegister();

      const unsubscribe = setupForegroundMessageListener((payload) => {
        console.log(
          "React Application received foreground push payload:",
          payload,
        );
        fetchNotifications();
        if (payload?.notification) {
          // toastInfo(
          //   `${payload.notification.title}: ${payload.notification.body}`,
          // );
          if (Notification.permission === "granted") {
            try {
              new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: "/favicon.ico",
              });
            } catch (err) {
              console.warn(
                "Could not launch browser Notification in foreground:",
                err,
              );
            }
          }
        }
      });

      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearInterval(interval);
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, canReadNotifications]);

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === "FCM_BG_MESSAGE") {
        console.log(
          "Received broadcast from Service Worker:",
          event.data.payload,
        );
        fetchNotifications();
        const payload = event.data.payload;
        if (payload?.notification) {
          // toastInfo(
          //   `${payload.notification.title}: ${payload.notification.body}`,
          // );
        }
      }
    };

    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );
    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, []);

  const handleLogout = async () => {
    await removeRegisteredDeviceToken();
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleNotificationClick = async (n) => {
    setNotifAnchorEl(null);
    if (!n.read) {
      try {
        await markNotificationReadApi(n.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, read: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    if (n.jobCard?.slug) {
      navigate(`/job-cards/view/${n.jobCard.slug}`);
    } else if (n.gateEntry?.slug) {
      navigate(`/gate-entry`);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getPageTitle = (pathname) => {
    if (pathname === '/locations') return 'Service Center & Location';
    if (pathname === '/locations/new') return 'Service Center & Location / Add';
    if (pathname.startsWith('/locations/edit/')) return 'Service Center & Location / Edit';
    if (pathname.startsWith('/locations/view/')) return 'Service Center & Location / Details';
    if (pathname.startsWith('/locations/')) return 'Service Center & Location';
    return (
      pathname
        .split("/")
        .filter(Boolean)
        .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(" / ") || "Dashboard"
    );
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setSidebarMobileOpen(true)}
          sx={{ mr: 2, display: { lg: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { xs: "none", lg: "flex" } }}
        >
          {effectiveCollapsed ? (
            <PanelLeft size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, fontSize: "1.1rem" }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {canReadNotifications && (
            <Tooltip title="Notifications" arrow>
              <Badge
                badgeContent={unreadCount}
                color="error"
                overlap="circular"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#ef4444",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    minWidth: 18,
                    height: 18,
                    borderRadius: "9px",
                    px: "4px",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)",
                    top: 3,
                    right: 3,
                    pointerEvents: "none"
                  }
                }}
              >
                <IconButton
                  color="inherit"
                  onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                      transform: "scale(1.05)",
                      borderColor: "#cbd5e1"
                    }
                  }}
                >
                  <Bell size={20} />
                </IconButton>
              </Badge>
            </Tooltip>
          )}

          {/* WhatsApp Direct Chats Hub Button (Excluded for Admin role) */}
          {!isAdmin && (
            <Tooltip title="WhatsApp Chats" arrow>
              <Badge
                badgeContent={whatsAppUnreadCount}
                color="error"
                max={99}
                overlap="circular"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#ef4444",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    minWidth: 18,
                    height: 18,
                    borderRadius: "9px",
                    px: "4px",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)",
                    top: 3,
                    right: 3,
                    pointerEvents: "none"
                  }
                }}
              >
                <IconButton
                  onClick={() => setIsWhatsAppDrawerOpen(true)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#e8f8f0",
                    border: "1px solid rgba(37, 211, 102, 0.28)",
                    color: "#25D366",
                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      bgcolor: "#dcfce7",
                      transform: "scale(1.05)",
                      borderColor: "rgba(37, 211, 102, 0.45)"
                    }
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M24 4C12.954 4 4 12.954 4 24c0 3.842 1.083 7.433 2.96 10.485L4 44l9.764-2.887A19.92 19.92 0 0024 44c11.046 0 20-8.954 20-20S35.046 4 24 4z"
                      fill="#25D366"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M33.47 28.53c-.5-.25-2.95-1.45-3.41-1.62-.46-.17-.79-.25-1.12.25-.33.5-1.29 1.62-1.58 1.95-.29.33-.58.37-1.08.12-.5-.25-2.11-.78-4.01-2.48-1.48-1.32-2.48-2.95-2.77-3.45-.29-.5-.03-.77.22-1.02.22-.22.5-.58.75-.87.25-.29.33-.5.5-.83.17-.33.08-.62-.04-.87-.12-.25-1.12-2.71-1.54-3.71-.41-.97-.82-.84-1.12-.86l-.96-.02c-.33 0-.87.12-1.33.62-.46.5-1.75 1.71-1.75 4.17 0 2.46 1.79 4.83 2.04 5.17.25.33 3.52 5.37 8.52 7.54 1.19.52 2.12.83 2.85 1.06 1.2.38 2.29.33 3.15.2 0.96-.14 2.95-1.21 3.37-2.37.42-1.17.42-2.17.29-2.37-.12-.21-.46-.33-.96-.58z"
                      fill="#FFFFFF"
                    />
                  </svg>
                </IconButton>
              </Badge>
            </Tooltip>
          )}

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={() => setNotifAnchorEl(null)}
            PaperProps={{ sx: { width: 320, mt: 1.5, borderRadius: 2 } }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Notifications
              </Typography>
              {/* <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={markAllRead}>
                Mark all read
              </Typography> */}
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <Box
                  sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
                >
                  <Typography variant="body2">No notifications</Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: "flex-start",
                      bgcolor: n.read ? "transparent" : "action.hover",
                      gap: 1.5,
                    }}
                  >
                    {!n.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          mt: 0.8,
                        }}
                      />
                    )}
                    {getNotificationIcon(n.type)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.read ? 400 : 500,
                          color: "text.primary",
                          mb: 0.5,
                          whiteSpace: "normal",
                        }}
                      >
                        {n.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {n.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Box>
          </Menu>
        </Box>
      </Toolbar>

      {/* WhatsApp Chats Slide-Over Drawer (Excluded for Admin role) */}
      {!isAdmin && (
        <WhatsAppChatDrawer
          isOpen={isWhatsAppDrawerOpen}
          onClose={() => {
            setIsWhatsAppDrawerOpen(false);
            fetchWhatsAppUnreadCount();
          }}
          unreadCount={whatsAppUnreadCount}
          onChatsUpdated={(newCount) => setWhatsAppUnreadCount(newCount)}
          locationId={userLocationId}
        />
      )}
    </AppBar>
  );
}