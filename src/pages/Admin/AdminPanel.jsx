import React, { useEffect, useState } from "react";
import "./AdminPanel.css";
import { TGSSticker } from "../../components/TGSSticker";
import adminSticker from "../../assets/AnimatedSticker_admin.tgs";
import apiFetch from "../../utils/apiFetch";

export default function AdminPanel() {
  // ========== TELEGRAM AUTH PROTECTION ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Telegram user admin ekanligini tekshirish
  useEffect(() => {
    try {
      // Backend admin endpointga test so'rov yuborish
      // Development da initData bo'lmasa ham backend o'tkazadi
      apiFetch("/api/admin/users")
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
          setAuthChecking(false);
        })
        .catch(() => {
          setIsAuthenticated(false);
          setAuthChecking(false);
        });
    } catch {
      setIsAuthenticated(false);
      setAuthChecking(false);
    }
  }, []);

  // All other state hooks - MUST be before any conditional return
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Users state
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("premium");
  const [userStats, setUserStats] = useState({
    total: 0,
    today: 0,
    totalReferrals: 0
  });

  // New: expanded order & show all
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Balance adjustment state
  const [balanceModal, setBalanceModal] = useState(null); // { username, currentBalance }
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Som balance adjustment state
  const [somBalanceModal, setSomBalanceModal] = useState(null); // { username, currentBalance }
  const [somBalanceAmount, setSomBalanceAmount] = useState("");
  const [somBalanceLoading, setSomBalanceLoading] = useState(false);
  
  // User details modal state
  const [userModal, setUserModal] = useState(null); // full user object
  const [referrerInfo, setReferrerInfo] = useState(null); // referrer user info
  const [userReferrals, setUserReferrals] = useState([]); // list of users referred by this user
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);

  // User card selection & modal type
  const [selectedUserCard, setSelectedUserCard] = useState(null); // selected user for buttons
  const [userDetailsModalType, setUserDetailsModalType] = useState(null); // "info" or "referrals"

  // 🔧 Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  // 🔔 Notifications state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [notifGlobal, setNotifGlobal] = useState(true);
  const [notifUserId, setNotifUserId] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifHistory, setNotifHistory] = useState([]);

  // Premium orders state
  const [premiumOrders, setPremiumOrders] = useState([]);
  const [premiumExpandedId, setPremiumExpandedId] = useState(null);
  const [premiumFilter, setPremiumFilter] = useState("all");
  const [premiumStats, setPremiumStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    expired: 0,
    failed: 0
  });
  const [premiumShowAll, setPremiumShowAll] = useState(false);

  // Analytics state
  const [analyticsPeriod, setAnalyticsPeriod] = useState("all"); // day, week, month, all
  const [analyticsData, setAnalyticsData] = useState({
    premium: { count: 0, totalAmount: 0, by3months: 0, by6months: 0, by12months: 0 },
    total: { count: 0, totalAmount: 0 }
  });
  const [dailyStats, setDailyStats] = useState([]); // [{date, stars, amount, count}]
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Wallet & Prices state
  const [walletBalance, setWalletBalance] = useState({ mainnet: 0, testnet: 0 });
  const [starPrices, setStarPrices] = useState({ priceFor50: 0, pricePerStar: 0, currency: "TON", availableStars: 0 });
  const [walletLoading, setWalletLoading] = useState(false);
  const [botStarsBalance, setBotStarsBalance] = useState(0);
  const [premiumPrices, setPremiumPrices] = useState({ 3: null, 6: null, 12: null });

  // Promocodes state
  const [promocodes, setPromocodes] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', target_type: 'premium', target_amount: '', discount_percent: 10, usage_limit: 10 });
  const [promoLoading, setPromoLoading] = useState(false);

  // ========== MAINTENANCE MODE ==========
  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch("/api/maintenance")
      .then(r => r.json())
      .then(d => setMaintenanceMode(d.maintenance))
      .catch(() => {});
  }, [isAuthenticated]);

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await apiFetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceMode(data.maintenance);
      }
    } catch (err) {
      console.error("Maintenance toggle xato:", err);
    }
    setMaintenanceLoading(false);
  };

  // ========== WALLET & PRICES FUNCTION ==========
  const fetchWalletAndPrices = async () => {
    setWalletLoading(true);
    try {
      // Parallel fetch wallet info, bot stars balance, and premium prices
      const [walletRes, botStarsRes, premiumPricesRes] = await Promise.all([
        apiFetch("/api/admin/wallet-info"),
        apiFetch("/api/admin/bot-stars-balance"),
        apiFetch("/api/admin/premium-prices")
      ]);
      
      const data = await walletRes.json();

      if (data.success) {
        setWalletBalance({
          mainnet: data.wallet.mainnet_balance || 0,
          testnet: data.wallet.testnet_balance || 0
        });

        setStarPrices({
          priceFor50: data.stars_price.price_for_50 || 0,
          pricePerStar: data.stars_price.price_per_star || 0,
          currency: data.stars_price.currency || "TON",
          availableStars: data.available_stars || 0
        });
      }

      // Bot stars balance
      const botStarsData = await botStarsRes.json();
      console.log("🤖 Bot stars response:", botStarsData);
      if (botStarsData.success) {
        setBotStarsBalance(botStarsData.bot_stars_balance || 0);
        console.log("✅ Bot stars balance set:", botStarsData.bot_stars_balance);
      } else {
        console.warn("⚠️ Bot stars fetch muvaffaqiyatsiz:", botStarsData.message || botStarsData.error);
        setBotStarsBalance(0);
      }

      // Premium prices
      const premiumPricesData = await premiumPricesRes.json();
      if (premiumPricesData.success) {
        setPremiumPrices(premiumPricesData.prices);
      }
    } catch (err) {
      console.error("❌ Wallet/Prices fetch error:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  // Get star price (per star)
  const getStarPrice = () => {
    return starPrices?.pricePerStar || 0;
  };

  // Get available stars (pre-calculated from backend)
  const getAvailableStars = () => {
    return starPrices?.availableStars || 0;
  };

  // Fetch wallet when analytics tab is active
  useEffect(() => {
    if (activeTab === "analytics" && isAuthenticated) {
      fetchWalletAndPrices();
    }
  }, [activeTab, isAuthenticated]);

  // ========== ANALYTICS FUNCTION (PREMIUM ONLY) ==========
  const fetchAnalytics = async () => {
    if (!isAuthenticated) return;
    setAnalyticsLoading(true);
    try {
      // Get date range based on period
      const now = new Date();
      let startDate = null;
      
      if (analyticsPeriod === "day") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (analyticsPeriod === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (analyticsPeriod === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch only premium data
      const premiumRes = await apiFetch("/api/admin/premium/list");
      const premiumJson = await premiumRes.json();
      const premiumData = premiumJson.orders || [];

      // Filter by date and delivered status
      const filterByDate = (items, dateField = "created_at") => {
        if (!startDate) return items;
        return items.filter(item => new Date(item[dateField]) >= startDate);
      };

      // Premium: delivered status
      const filteredPremium = filterByDate(premiumData).filter(tx => 
        tx.status === "delivered"
      );

      // Calculate premium stats by months (3, 6, 12)
      const by3months = filteredPremium.filter(tx => tx.months === 3).length;
      const by6months = filteredPremium.filter(tx => tx.months === 6).length;
      const by12months = filteredPremium.filter(tx => tx.months === 12).length;

      const premiumStats = {
        count: filteredPremium.length,
        totalAmount: filteredPremium.reduce((sum, tx) => sum + (tx.amount || 0), 0),
        by3months,
        by6months,
        by12months
      };

      setAnalyticsData({
        premium: premiumStats,
        total: {
          count: premiumStats.count,
          totalAmount: premiumStats.totalAmount
        }
      });

      // Calculate daily breakdown from delivered premium (last 7 days)
      const completedPremium = premiumData.filter(tx => 
        tx.status === "delivered"
      );
      
      const dailyMap = {};
      
      // Get last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap[key] = { date: key, amount: 0, count: 0 };
      }

      // Aggregate premium transactions by day
      completedPremium.forEach(tx => {
        const txDate = new Date(tx.created_at).toISOString().split('T')[0];
        if (dailyMap[txDate]) {
          dailyMap[txDate].amount += tx.amount || 0;
          dailyMap[txDate].count += 1;
        }
      });

      setDailyStats(Object.values(dailyMap));
    } catch (err) {
      console.error("❌ Analytics fetch error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch analytics when period changes
  useEffect(() => {
    if (activeTab === "analytics" && isAuthenticated) {
      fetchAnalytics();
    }
  }, [analyticsPeriod, activeTab, isAuthenticated]);

  // ========== ALL FUNCTIONS ==========
  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);

      const todayStr = new Date().toDateString();
      const stats = {
        total: data.length,
        today: data.filter(u => new Date(u.created_at).toDateString() === todayStr).length,
        totalReferrals: data.reduce((acc, u) => acc + (u.total_referrals || 0), 0)
      };
      setUserStats(stats);
    } catch (err) {
      console.error("❌ Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPremiumOrders = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/premium/list?status=${premiumFilter}`);
      const data = await res.json();
      
      if (data.success) {
        setPremiumOrders(data.orders || []);
        
        // Calculate stats from all orders
        const allRes = await apiFetch("/api/admin/premium/list?status=all");
        const allData = await allRes.json();
        
        if (allData.success) {
          const orders = allData.orders || [];
          const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            expired: orders.filter(o => o.status === 'expired').length,
            failed: orders.filter(o => o.status === 'failed' || o.status === 'error').length
          };
          setPremiumStats(stats);
        }
      }
    } catch (err) {
      console.error("❌ Premium orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = null; // deprecated - Telegram auth ishlatiladi

  // 🔔 Fetch notification history
  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifHistory(data.notifications || []);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  // 🔔 Send notification
  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("❌ Sarlavha va xabar kerak!");
      return;
    }
    if (!notifGlobal && !notifUserId.trim()) {
      alert("❌ User ID kiriting yoki global tanlang!");
      return;
    }

    setNotifSending(true);
    try {
      const res = await apiFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          is_global: notifGlobal,
          user_id: notifGlobal ? null : notifUserId.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Notification yuborildi! (${data.type === 'global' ? 'Barchaga' : 'Shaxsiy'})`);
        setNotifTitle("");
        setNotifMessage("");
        setNotifUserId("");
        fetchNotifications();
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("Send notification error:", err);
      alert("❌ Server xato!");
    } finally {
      setNotifSending(false);
    }
  };

  // 🔔 Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm("Bu notificationni o'chirasizmi?")) return;
    try {
      await apiFetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      fetchNotifications();
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  // 🎟 Fetch Promocodes
  const fetchPromocodes = async () => {
    setPromoLoading(true);
    try {
      const res = await apiFetch("/api/admin/promocodes");
      const data = await res.json();
      if (res.ok) setPromocodes(data);
    } catch (err) {
      console.error("Fetch promocodes error:", err);
    } finally {
      setPromoLoading(false);
    }
  };

  // 🎟 Create Promocode
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.discount_percent || !promoForm.usage_limit) {
      alert("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    try {
      const res = await apiFetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Pramakod yaratildi!");
        setPromoForm({ code: '', target_type: 'stars', target_amount: '', discount_percent: 10, usage_limit: 10 });
        fetchPromocodes();
      } else {
        alert("Xato: " + (data.error || "Noma'lum xato"));
      }
    } catch (err) {
      console.error("Create promo error", err);
      alert("Server xatosi");
    }
  };

  // 🎟 Toggle Promocode Status
  const handleTogglePromo = async (code, isActive) => {
    try {
      await apiFetch(`/api/admin/promocodes/${code}/toggle`, {
        method: "PUT"
      });
      fetchPromocodes();
    } catch (err) {
      console.error("Toggle promo error", err);
    }
  };

  // 🎟 Delete Promocode
  const handleDeletePromo = async (code) => {
    if (!window.confirm("Bu pramakodni o'chirasizmi?")) return;
    try {
      await apiFetch(`/api/admin/promocodes/${code}`, { method: "DELETE" });
      fetchPromocodes();
    } catch (err) {
      console.error("Delete promo error", err);
    }
  };

  // ========== ALL useEffect HOOKS ==========
  // Fetch data based on active tab
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "premium") {
      fetchPremiumOrders();
    } else if (activeTab === "notifications") {
      fetchNotifications();
    } else if (activeTab === "promocodes") {
      fetchPromocodes();
    }
  }, [filter, activeTab, isAuthenticated, premiumFilter]);

  // Auto refresh - disabled
  useEffect(() => {
    if (!isAuthenticated) return;
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        if (activeTab === "users") fetchUsers();
        else if (activeTab === "premium") fetchPremiumOrders();
      }, 30000); // 30 seconds instead of 5
    }
    return () => clearInterval(interval);
  }, [autoRefresh, filter, activeTab, isAuthenticated]);

  // ========== AUTH CHECK SCREEN ==========
  if (authChecking) {
    return (
      <div className="admin-password-screen">
        <div className="admin-password-box">
          <div className="admin-sticker-container">
            <TGSSticker stickerPath={adminSticker} className="admin-sticker" />
          </div>
          <h2>🔐 Admin Panel</h2>
          <p>Autentifikatsiya tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-password-screen">
        <div className="admin-password-box">
          <div className="admin-sticker-container">
            <TGSSticker stickerPath={adminSticker} className="admin-sticker" />
          </div>
          <h2>🚫 Ruxsat berilmagan</h2>
          <p>Sizda admin huquqi yo'q</p>
        </div>
      </div>
    );
  }
  // ========== END AUTH PROTECTION ==========

  // Premium order expire
  const expirePremiumOrder = async (id) => {
    try {
      if (!window.confirm("❌ Bu premium buyurtmani expired qilasizmi?")) return;

      const res = await apiFetch(`/api/admin/premium/update/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "expired" }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Premium order expired qilindi!");
        fetchPremiumOrders();
        setPremiumExpandedId(null);
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("❌ Premium expire error:", err);
      alert("Server xato!");
    }
  };

  // Premium order send
  const sendPremium = async (id) => {
    try {
      if (!window.confirm("💎 Ushbu buyurtmaga premium yuborilsinmi?")) return;

      const res = await apiFetch(`/api/admin/premium/resend/${id}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        alert("💎 Premium yuborildi!");
        fetchPremiumOrders();
        setPremiumExpandedId(null);
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("❌ Premium yuborishda xato:", err);
      alert("Server xato!");
    }
  };

  // Premium order update status
  const updatePremiumStatus = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/api/admin/premium/update/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchPremiumOrders();
        setPremiumExpandedId(null);
      }
    } catch (err) {
      console.error("❌ Premium status update xato:", err);
    }
  };

  // Referral withdrawal approve
  const approveWithdrawal = async (id) => {
    try {
      if (!window.confirm("✅ Bu so'rovni tasdiqlaysizmi? (Stars yuborildi deb belgilanadi)")) return;

      const res = await apiFetch(`/api/admin/referral-withdrawals/${id}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Tasdiqlandi!");
        fetchRefWithdrawals();
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("❌ Approve error:", err);
      alert("Server xato!");
    }
  };

  // Referral withdrawal reject
  const rejectWithdrawal = async (id) => {
    try {
      if (!window.confirm("❌ Bu so'rovni bekor qilasizmi? (Balans qaytariladi)")) return;

      const res = await apiFetch(`/api/admin/referral-withdrawals/${id}/reject`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        alert("❌ Bekor qilindi, balans qaytarildi!");
        fetchRefWithdrawals();
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("❌ Reject error:", err);
      alert("Server xato!");
    }
  };

  // Admin: Adjust user balance
  const openBalanceModal = (user) => {
    setBalanceModal({
      username: user.username,
      currentBalance: user.referral_balance || 0
    });
    setBalanceAmount("");
  };

  const adjustBalance = async (action) => {
    if (!balanceModal || !balanceAmount) return;
    
    const amount = parseInt(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("❌ Noto'g'ri miqdor!");
      return;
    }

    const confirmMsg = action === "add" 
      ? `➕ @${balanceModal.username} ga ${amount} ⭐ qo'shilsinmi?`
      : `➖ @${balanceModal.username} dan ${amount} ⭐ ayirilsinmi?`;

    if (!window.confirm(confirmMsg)) return;

    setBalanceLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${balanceModal.username}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, action }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Balans o'zgartirildi!\n${data.previousBalance} → ${data.newBalance} ⭐`);
        setBalanceModal(null);
        setBalanceAmount("");
        fetchUsers(); // Refresh users list
      } else {
        alert("❌ Xato: " + data.error);
      }
    } catch (err) {
      console.error("❌ Balance adjust error:", err);
      alert("Server xato!");
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load referrer info and referrals when opening user modal
  const loadUserReferralsData = async (userId) => {
    setReferralsLoading(true);
    try {
      // Fetch referrer info if exists
      if (userModal?.referrer_user_id) {
        const referrerRes = await apiFetch(`/api/admin/user/${userModal.referrer_user_id}`);
        const referrerData = await referrerRes.json();
        if (referrerData) {
          setReferrerInfo(referrerData);
        }
      }
      
      // Fetch all referrals by this user
      const referralsRes = await apiFetch(`/api/admin/user/${userId}/referrals`);
      const referralsData = await referralsRes.json();
      if (Array.isArray(referralsData)) {
        setUserReferrals(referralsData);
      }
    } catch (err) {
      console.error("❌ Load referrals error:", err);
    } finally {
      setReferralsLoading(false);
    }
  };

  // Remove a referral relationship
  const removeReferral = async (referralUserId) => {
    if (!userModal) return;
    
    // Find the referral user to show username
    const referralUser = userReferrals?.find(r => r.id === referralUserId);
    const username = referralUser?.username || "Unknown";
    
    console.log(`\n🔍 REFERRAL O'CHIRISH JARAYONI BOSHLANDI`);
    console.log(`📋 Referralni o'chirayotgan user: @${userModal.username} (ID: ${userModal.user_id})`);
    console.log(`🗑️ O'chiriladigan referral: @${username} (ID: ${referralUserId})`);
    console.log(`📝 Amalga oshiriladigan: user.referrer_user_id = NULL`);
    
    if (!window.confirm(`@${username} foydalanuvchining referral munosabatini o'chirmoqchimisiz?\n\nBu amal referrer_user_id ni NULL qib qo'yadi.`)) {
      console.log(`⚠️ Foydalanuvchi bekor qildi`);
      return;
    }
    
    try {
      console.log(`⏳ Backend ga POST so'rov yuborilmoqda: /api/admin/user/${referralUserId}/remove-referrer`);
      const res = await apiFetch(`/api/admin/user/${referralUserId}/remove-referrer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const response = await res.json();
      
      if (res.ok) {
        console.log(`✅ O'CHIRISH MUVAFFAQIYATLI!`);
        console.log(`📊 Backend javobi:`, response);
        console.log(`🔄 Referrallar ro'yxati yangilanimoqda...`);
        alert(`✅ @${username} ning referral munosabati o'chirildi!\nReferrer_user_id = NULL`);
        loadUserReferralsData(userModal.user_id);
      } else {
        console.error(`❌ O'CHIRISH MUVAFFAQ BO'LMADI:`, response);
        alert(`❌ Xato yuz berdi: ${response.error || "Noma'lum xato"}`);
      }
    } catch (err) {
      console.error(`❌ Network yoki server xato:`, err);
      alert("Server xato!");
    }
  };

  // Admin: Adjust user som balance
  const openSomBalanceModal = (user) => {
    setSomBalanceModal({
      username: user.username,
      currentBalance: user.som_balance || 0
    });
    setSomBalanceAmount("");
  };

  const adjustSomBalance = async (action) => {
    if (!somBalanceModal || !somBalanceAmount) return;

    const amount = parseInt(somBalanceAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Noto'g'ri miqdor!");
      return;
    }

    const confirmMsg = action === "add"
      ? `@${somBalanceModal.username} ga ${amount.toLocaleString()} so'm qo'shilsinmi?`
      : `@${somBalanceModal.username} dan ${amount.toLocaleString()} so'm ayirilsinmi?`;

    if (!window.confirm(confirmMsg)) return;

    setSomBalanceLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${somBalanceModal.username}/som-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, action }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Balans o'zgartirildi!\n${data.previousBalance.toLocaleString()} → ${data.newBalance.toLocaleString()} so'm`);
        setSomBalanceModal(null);
        setSomBalanceAmount("");
        fetchUsers();
      } else {
        alert("Xato: " + data.error);
      }
    } catch (err) {
      console.error("Som balance adjust error:", err);
      alert("Server xato!");
    } finally {
      setSomBalanceLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(s) ||
      u.referral_code?.toLowerCase().includes(s)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f39c12",
      completed: "#27ae60",
      delivered: "#27ae60",
      expired: "#e74c3c",
      stars_sent: "#3498db",
      gift_sent: "#9b59b6",
      failed: "#c0392b",
      error: "#8e44ad"
    };
    return colors[status] || "#95a5a6";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      completed: "✅",
      delivered: "💎",
      expired: "❌",
      stars_sent: "🌟",
      gift_sent: "🎁",
      failed: "⚠️",
      error: "🔴"
    };
    return icons[status] || "❓";
  };

  return (
    <div className="admin-panel-new">
      {/* Header with controls */}
      <header className="admin-header-v2">
        <div className="header-top">
          <h1>⚡ Admin</h1>
          <div className="header-right">
            {/* Compact site switch */}
            <div className={`site-mini ${maintenanceMode ? 'off' : 'on'}`}>
              <span className="site-dot"></span>
              <span className="site-txt">{maintenanceMode ? 'OFF' : 'ON'}</span>
              <button className="site-toggle" onClick={toggleMaintenance} disabled={maintenanceLoading}>
                <span className={`toggle-track ${maintenanceMode ? 'active' : ''}`}>
                  <span className="toggle-thumb"></span>
                </span>
              </button>
            </div>
            {/* Refresh */}
            <button className="hdr-btn refresh" onClick={() => {
              if (activeTab === "premium") fetchPremiumOrders();
              else if (activeTab === "users") fetchUsers();
              else if (activeTab === "analytics") { fetchAnalytics(); fetchWalletAndPrices(); }
            }}>
              🔄
            </button>
          </div>
        </div>
        <div className="header-btns">
          <button 
            className={`hdr-nav-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab(activeTab === "analytics" ? "premium" : "analytics")}
          >
            📊 Analitika
          </button>
          <button 
            className={`hdr-nav-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            🔔 Xabar
          </button>
          <button 
            className={`hdr-nav-btn ${activeTab === "promocodes" ? "active" : ""}`}
            onClick={() => setActiveTab("promocodes")}
          >
            ➕ Promokod
          </button>
          
        </div>
      </header>

      {/* TABS */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === "premium" ? "active" : ""}`}
          onClick={() => setActiveTab("premium")}
        >
          Premium
        </button>
        <button 
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      {/* ==================== NOTIFICATIONS TAB ==================== */}
      {activeTab === "notifications" && (
        <div className="tab-content notifications-section">
          <h3 style={{margin: "0 0 16px", fontSize: "1.1rem", color: "#fff"}}>🔔 Bildirishnoma yuborish</h3>
          
          <input
            type="text"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "14px",
              marginBottom: "10px"
            }}
            placeholder="Sarlavha..."
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
          />
          
          <textarea
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
              marginBottom: "10px"
            }}
            placeholder="Xabar matni..."
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
          />
          
          <div style={{display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap"}}>
            {["info", "success", "warning", "promo"].map(t => (
              <button
                key={t}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: notifType === t ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.15)",
                  background: notifType === t ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
                onClick={() => setNotifType(t)}
              >
                {t === "info" ? "ℹ️ Info" : t === "success" ? "✅ Success" : t === "warning" ? "⚠️ Warning" : "🎁 Promo"}
              </button>
            ))}
          </div>
          
          <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px"}}>
            <label style={{display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "14px", cursor: "pointer"}}>
              <input
                type="checkbox"
                checked={notifGlobal}
                onChange={(e) => setNotifGlobal(e.target.checked)}
                style={{width: "18px", height: "18px", accentColor: "#3b82f6"}}
              />
              🌐 Barchaga yuborish
            </label>
          </div>
          
          {!notifGlobal && (
            <input
              type="text"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "12px"
              }}
              placeholder="User ID (Telegram)"
              value={notifUserId}
              onChange={(e) => setNotifUserId(e.target.value)}
            />
          )}
          
          <button
            style={{
              width: "100%",
              padding: "14px",
              background: notifSending ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: notifSending ? "not-allowed" : "pointer",
              opacity: (!notifTitle.trim() || !notifMessage.trim() || (!notifGlobal && !notifUserId.trim())) ? 0.5 : 1,
              marginBottom: "16px"
            }}
            onClick={sendNotification}
            disabled={notifSending || !notifTitle.trim() || !notifMessage.trim() || (!notifGlobal && !notifUserId.trim())}
          >
            {notifSending ? "Yuborilmoqda..." : "🔔 Bildirishnoma yuborish"}
          </button>
          
          <h4 style={{margin: "20px 0 12px", fontSize: "1rem", color: "rgba(255,255,255,0.8)"}}>📋 Oxirgi bildirishnomalar</h4>
          
          <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            {notifHistory.length === 0 ? (
              <div style={{textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.5)", fontSize: "14px"}}>
                Hozircha bildirishnomalar yo'q
              </div>
            ) : (
              notifHistory.map(n => (
                <div 
                  key={n.id}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}
                >
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px"}}>
                    <div style={{fontWeight: "600", color: "#fff", fontSize: "14px"}}>
                      {n.type === "info" ? "ℹ️" : n.type === "success" ? "✅" : n.type === "warning" ? "⚠️" : "🎁"} {n.title}
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#ef4444",
                        padding: "4px 8px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  <div style={{color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px"}}>{n.message}</div>
                  <div style={{display: "flex", gap: "8px", fontSize: "11px", color: "rgba(255,255,255,0.4)"}}>
                    <span>{n.is_global ? "🌐 Global" : `👤 ${n.user_id}`}</span>
                    <span>•</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== ANALYTICS TAB ==================== */}
      {activeTab === "analytics" && (
        <div className="tab-content analytics-list">
          
          {/* Period Filter */}
          <div className="period-row">
            {["day", "week", "month", "all"].map(p => (
              <button 
                key={p}
                className={`period-chip ${analyticsPeriod === p ? "active" : ""}`}
                onClick={() => setAnalyticsPeriod(p)}
              >
                {p === "day" ? "Kun" : p === "week" ? "Hafta" : p === "month" ? "Oy" : "Barchasi"}
              </button>
            ))}
          </div>

          {/* Wallet Info List */}
          <div className="info-list wallet-list">
            <div className="info-row">
              <span className="info-label">⭐ Mavjud stars:</span>
              <span className="info-value gold">{walletLoading ? '...' : getAvailableStars().toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">⭐ Userbot balansi:</span>
              <span className="info-value gold">{walletLoading ? '...' : botStarsBalance.toLocaleString()} ⭐</span>
            </div>
            <div className="info-row">
              <span className="info-label">💎 TON balance:</span>
              <span className="info-value">{walletLoading ? '...' : walletBalance.mainnet.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">💵 50 stars narxi:</span>
              <span className="info-value green">{walletLoading ? '...' : (starPrices.priceFor50 || 0).toFixed(3)} TON</span>
            </div>
          </div>

          {/* Premium Prices List */}
          <div className="info-list premium-prices-list">
            <div className="list-title">💎 Premium narxlari (TON)</div>
            <div className="info-row">
              <span className="info-label">3 oylik:</span>
              <span className="info-value cyan">{walletLoading ? '...' : (premiumPrices[3]?.price || 0).toFixed(2)} TON</span>
            </div>
            <div className="info-row">
              <span className="info-label">6 oylik:</span>
              <span className="info-value cyan">{walletLoading ? '...' : (premiumPrices[6]?.price || 0).toFixed(2)} TON</span>
            </div>
            <div className="info-row">
              <span className="info-label">12 oylik:</span>
              <span className="info-value cyan">{walletLoading ? '...' : (premiumPrices[12]?.price || 0).toFixed(2)} TON</span>
            </div>
          </div>

          {/* Sales Stats List */}
          {analyticsLoading ? (
            <div className="analytics-loading-v2">⏳ Yuklanmoqda...</div>
          ) : (
            <div className="info-list sales-list">
              <div className="info-row total-row">
                <span className="info-label">📈 Jami savdo:</span>
                <span className="info-value">
                  <b>{analyticsData.total.count}</b> ta &nbsp;·&nbsp; <b>{analyticsData.total.totalAmount.toLocaleString()}</b> so'm
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">💎 Premium (3 oy):</span>
                <span className="info-value">
                  {analyticsData.premium.by3months} ta
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">💎 Premium (6 oy):</span>
                <span className="info-value">
                  {analyticsData.premium.by6months} ta
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">💎 Premium (12 oy):</span>
                <span className="info-value">
                  {analyticsData.premium.by12months} ta
                </span>
              </div>
            </div>
          )}

          {/* Daily Stats */}
          <div className="info-list daily-list">
            <div className="list-title">📅 Oxirgi 7 kun</div>
            {dailyStats.map((day, i) => (
              <div key={i} className={`info-row ${day.count > 0 ? 'has-data' : 'no-data'}`}>
                <span className="info-label">{new Date(day.date).toLocaleDateString('uz-UZ', {day: '2-digit', month: 'short'})}</span>
                <span className="info-value">
                  {day.count} ta &nbsp;·&nbsp; {day.amount.toLocaleString()} so'm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== USERS TAB ==================== */}
      {activeTab === "users" && (
        <div className="tab-content">
          {/* User Stats */}
          <div className="stats-text">
            <span>Jami: <b>{userStats.total}</b></span>
            <span>Bugun: <b>{userStats.today}</b></span>
            <span>Referrals: <b>{userStats.totalReferrals}</b></span>
          </div>

          {/* Search */}
          <div className="filters" style={{ padding: '0 10px' }}>
            <input
              type="text"
              placeholder="🔍 Username yoki referral code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: '#fff'
              }}
            />
          </div>

          {/* Users List */}
          {loading && !autoRefresh ? (
            <div className="loader">⏳ Yuklanmoqda...</div>
          ) : (
            <div className="users-list" style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {filteredUsers.length === 0 ? (
                <div className="empty-state">👤 Foydalanuvchilar yo'q</div>
              ) : (
                filteredUsers.slice(0, showAll ? filteredUsers.length : 20).map((u, index) => (
                  <div 
                    key={u.id} 
                    className="user-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: selectedUserCard?.id === u.id ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* User Info Section */}
                    <div 
                      onClick={() => {
                        setSelectedUserCard(selectedUserCard?.id === u.id ? null : u);
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr auto',
                        alignItems: 'center',
                        padding: '14px 12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      <div style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {filteredUsers.length - index}
                      </div>
                      
                      <div className="user-main" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <span className="user-name" style={{
                          fontSize: '15px', 
                          fontWeight: '600', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis'
                        }}>
                          @{u.username || 'Noma\'lum'}
                        </span>
                        <span className="user-id" style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)'}}>
                          ID: {u.user_id}
                        </span>
                      </div>
                      
                      <div className="user-stats" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Yulduzlar:</span>
                          <span style={{fontSize: '14px', fontWeight: 'bold', color: '#ffd700'}}>{u.referral_balance || 0}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Do'stlar:</span>
                          <span style={{fontSize: '14px', fontWeight: '600', color: '#4caf50'}}>{u.total_referrals || 0}</span>
                        </div>
                        {u.som_balance > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>So'm:</span>
                            <span style={{fontSize: '13px', color: '#f9a825'}}>{(u.som_balance || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Show below user info */}
                    {selectedUserCard?.id === u.id && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '10px 12px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(0,0,0,0.3)'
                      }}>
                        <button
                          onClick={() => {
                            setUserModal(u);
                            setUserDetailsModalType("info");
                            loadUserReferralsData(u.user_id);
                          }}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'transform 0.1s',
                          }}
                          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          ℹ️ Ma'lumot
                        </button>
                        <button
                          onClick={() => {
                            setUserModal(u);
                            setUserDetailsModalType("referrals");
                            loadUserReferralsData(u.user_id);
                          }}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #f9a825 0%, #f08a5d 100%)',
                            color: '#fff',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'transform 0.1s'
                          }}
                          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          👥 Referallar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {filteredUsers.length > 20 && !showAll && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <button className="show-all-btn" onClick={() => setShowAll(true)}>
                    👥 Barcha foydalanuvchilar ({filteredUsers.length} ta)
                  </button>
                </div>
              )}

              {showAll && filteredUsers.length > 20 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <button className="show-all-btn" onClick={() => setShowAll(false)}>
                    🔼 Faqat 20 tani ko'rish
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== PREMIUM ORDERS TAB ==================== */}
      {activeTab === "premium" && (
        <div className="tab-content">
          {/* Premium Stats */}
          <div className="stats-text">
            <span>Jami: <b>{premiumStats.total}</b></span>
            <span>Pending: <b>{premiumStats.pending}</b></span>
            <span>Delivered: <b>{premiumStats.delivered}</b></span>
            <span>Expired: <b>{premiumStats.expired}</b></span>
            <span>Failed: <b>{premiumStats.failed}</b></span>
          </div>

          {/* Premium Filters */}
          <div className="filters">
            <input
              type="text"
              placeholder="🔍 Qidiruv..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={premiumFilter} onChange={(e) => setPremiumFilter(e.target.value)} className="filter-select">
              <option value="all">Hammasi</option>
              <option value="pending">⏳ Pending</option>
              <option value="delivered">💎 Delivered</option>
              <option value="expired">❌ Expired</option>
              <option value="failed">⚠️ Failed</option>
              <option value="error">🔴 Error</option>
            </select>
          </div>

          {loading && !autoRefresh ? (
            <div className="loader">⏳ Yuklanmoqda...</div>
          ) : (
            <div className="orders-list">
              {premiumOrders.length === 0 ? (
                <div className="empty-state">💎 Premium buyurtmalar yo'q</div>
              ) : (
                premiumOrders
                  .filter((tx) => {
                    const s = search.toLowerCase();
                    return (
                      tx.username?.toLowerCase().includes(s) ||
                      tx.sender_username?.toLowerCase().includes(s) ||
                      tx.recipient?.toLowerCase().includes(s) ||
                      tx.owner_user_id?.toString().includes(s) ||
                      tx.id.toString().includes(s)
                    );
                  })
                  .slice(0, premiumShowAll ? premiumOrders.length : 20)
                  .map((tx) => (
                  <div key={tx.id} className="order-card">
                    <div 
                      className="order-header"
                      onClick={() => setPremiumExpandedId(premiumExpandedId === tx.id ? null : tx.id)}
                    >
                      <div className="order-main">
                        <span className="order-id">#{tx.id}</span>
                        <span className="order-user">@{tx.sender_username || '?'} → @{tx.username}</span>
                        <span className="order-stars">{tx.months || 1} oy 💎</span>
                      </div>
                      <div 
                        className="order-status"
                        style={{ backgroundColor: getStatusColor(tx.status) }}
                      >
                        {getStatusIcon(tx.status)} {tx.status}
                      </div>
                    </div>

                    {premiumExpandedId === tx.id && (
                      <div className="order-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Yuboruvchi</span>
                            <span className="detail-value">@{tx.sender_username || '-'} ({tx.owner_user_id || '-'})</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Qabul qiluvchi</span>
                            <span className="detail-value">@{tx.username} ({tx.recipient || '-'})</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Muddat</span>
                            <span className="detail-value">{tx.months || 1} oy</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Amount</span>
                            <span className="detail-value">{tx.amount?.toLocaleString()} so'm</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Payment</span>
                            <span className="detail-value">{tx.payment_method || "card"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Transaction ID</span>
                            <span className="detail-value">{tx.transaction_id || "-"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Created</span>
                            <span className="detail-value">{new Date(tx.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions - for pending and error */}
                        {(tx.status === "pending" || tx.status === "error") && (
                          <div className="order-actions">
                            {tx.status === "error" && (
                              <button 
                                className="action-btn send"
                                onClick={(e) => { e.stopPropagation(); sendPremium(tx.id); }}
                              >
                                💎 Premium Send
                              </button>
                            )}
                            <button 
                              className="action-btn expire"
                              onClick={(e) => { e.stopPropagation(); expirePremiumOrder(tx.id); }}
                            >
                              ❌ Expired qilish
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Show All Button */}
              {premiumOrders.length > 20 && !premiumShowAll && (
                <button className="show-all-btn" onClick={() => setPremiumShowAll(true)}>
                  💎 Barcha buyurtmalarni ko'rish ({premiumOrders.length} ta)
                </button>
              )}

              {premiumShowAll && premiumOrders.length > 20 && (
                <button className="show-all-btn" onClick={() => setPremiumShowAll(false)}>
                  🔼 Faqat oxirgi 20 tani ko'rish
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== PROMOCODES TAB ==================== */}
      {activeTab === "promocodes" && (
        <div className="tab-content settings-tab">
          <div className="section-header">
            <h3 className="settings-section-title">Pramakodlar Boshqaruvi</h3>
            <p className="settings-section-desc">Foydalanuvchilar uchun maxsus chegirma kodlarini yarating</p>
          </div>

          <div className="settings-add-package">
            <form className="package-form" onSubmit={handleCreatePromo}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pramakod KODI</label>
                  <input
                    type="text"
                    required
                    value={promoForm.code}
                    onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                    placeholder="Masalan: STARS50"
                  />
                </div>
                <div className="form-group">
                  <label>Chegirma Foizi (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={promoForm.discount_percent}
                    onChange={e => setPromoForm({...promoForm, discount_percent: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>Maksimal Foydalanish</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={promoForm.usage_limit}
                    onChange={e => setPromoForm({...promoForm, usage_limit: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="form-row" style={{marginTop: '15px'}}>
                <div className="form-group">
                  <label>Qaysi bo'lim uchun?</label>
                  <div className="custom-select-wrapper">
                    <select
                      value={promoForm.target_type}
                      onChange={e => setPromoForm({...promoForm, target_type: e.target.value, target_amount: ''})}
                    >
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Qaysi oylar uchun? (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={promoForm.target_amount}
                    onChange={e => setPromoForm({...promoForm, target_amount: e.target.value})}
                    placeholder="Masalan: 3, 6 yoki 12"
                  />
                </div>
              </div>
              <button className="settings-submit-btn" style={{marginTop: '20px'}} type="submit">
                Yaratish
              </button>
            </form>
          </div>

          <div className="packages-grid">
            {promoLoading ? <div className="loading-state">Yuklanmoqda...</div> : 
             promocodes.map(promo => (
              <div key={promo.code} className={`package-item ${!promo.is_active ? 'inactive' : ''}`}>
                <div className="package-info" style={{marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span className="package-stars" style={{fontSize: '18px', fontWeight: 'bold', color: '#fff'}}>{promo.code}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(promo.code);
                        alert(`Skopirovano: ${promo.code}`);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#fff', cursor: 'pointer', fontSize: '12px'
                      }}
                      title="Nusxalash"
                    >
                      Nusxa
                    </button>
                  </div>
                  <span className="package-discount" style={{background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', padding: '4px 8px', borderRadius: '6px', fontSize: '13px'}}>{promo.discount_percent}%</span>
                </div>
                <div style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                  <span>Maqsad:</span>
                  <span style={{color: '#fff'}}>{promo.target_type === 'all' ? 'Barchasi' : promo.target_type} {promo.target_amount ? `(${promo.target_amount})` : ''}</span>
                </div>
                <div style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between'}}>
                  <span>Foydalanildi:</span>
                  <span style={{color: '#fff'}}>{promo.used_count} / {promo.usage_limit}</span>
                </div>
                <div className="package-actions" style={{display: 'flex', gap: '8px'}}>
                  <button className="action-btn" style={{flex: 1, padding: '10px', background: promo.is_active ? 'rgba(255,255,255,0.1)' : 'rgba(76,175,80,0.2)', color: promo.is_active ? '#fff' : '#4caf50', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: '0.2s'}} onClick={() => handleTogglePromo(promo.code, promo.is_active)}>
                    {promo.is_active ? 'To\'xtatish' : 'Faollashtirish'}
                  </button>
                  <button className="action-btn" style={{padding: '10px 15px', background: 'rgba(244,67,54,0.1)', color: '#f44336', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: '0.2s'}} onClick={() => handleDeletePromo(promo.code)}>
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
            {promocodes.length === 0 && !promoLoading && (
              <div className="empty-state" style={{gridColumn: '1 / -1'}}>Pramakodlar yo'q</div>
            )}
          </div>
        </div>
      )}

      {/* ==================== USER DETAILS MODAL ==================== */}
      {userModal && userDetailsModalType === "info" && (
        <div className="balance-modal-overlay" onClick={() => { 
          setUserModal(null); 
          setUserDetailsModalType(null);
          setSelectedUserCard(null);
        }}>
          <div className="balance-modal user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="balance-modal-header">
              <h3>👤 Foydalanuvchi ma'lumotlari</h3>
              <button className="modal-close" onClick={() => { 
                setUserModal(null); 
                setUserDetailsModalType(null);
                setSelectedUserCard(null);
              }}>✕</button>
            </div>
            
            <div className="balance-modal-body">
              <div className="user-detail-section">
                <div className="user-detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">#{userModal.id}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Ism:</span>
                  <span className="detail-value">{userModal.name || "-"}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value highlight">@{userModal.username}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Telegram ID:</span>
                  <span className="detail-value">{userModal.user_id || "-"}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Referral Code:</span>
                  <span className="detail-value" style={{fontFamily: 'monospace'}}>{userModal.referral_code || "-"}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Referrer ID:</span>
                  <span className="detail-value">{userModal.referrer_user_id || "-"}</span>
                </div>
                {referrerInfo && (
                  <div className="user-detail-row" style={{background: 'rgba(102, 126, 234, 0.1)', padding: '8px', borderRadius: '6px', margin: '4px 0'}}>
                    <span className="detail-label">Oldin'dan:</span>
                    <span className="detail-value" style={{color: '#667eea'}}>@{referrerInfo.username}</span>
                  </div>
                )}
                <div className="user-detail-row">
                  <span className="detail-label">Ref Balance:</span>
                  <span className="detail-value highlight">💰 {userModal.referral_balance || 0} ⭐</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Total Earnings:</span>
                  <span className="detail-value">{userModal.total_earnings || 0} ⭐</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Total Referrals:</span>
                  <span className="detail-value">👥 {userModal.total_referrals || 0}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Obuna:</span>
                  <span className="detail-value">{userModal.subscribe_user ? "✅ Ha" : "❌ Yo'q"}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Til:</span>
                  <span className="detail-value">{userModal.language || "uz"}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Ro'yxatdan o'tgan:</span>
                  <span className="detail-value">{new Date(userModal.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="user-detail-actions">
                <button
                  className="balance-btn add"
                  onClick={() => {
                    setUserModal(null);
                    setUserDetailsModalType(null);
                    openBalanceModal(userModal);
                  }}
                >
                  ➕➖ Referral balansni o'zgartirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {userModal && userDetailsModalType === "referrals" && (
        <div className="balance-modal-overlay" onClick={() => { 
          setUserModal(null); 
          setUserDetailsModalType(null);
          setSelectedUserCard(null);
        }}>
          <div className="balance-modal user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="balance-modal-header">
              <h3>👥 @{userModal.username} ning referallari</h3>
              <button className="modal-close" onClick={() => { 
                setUserModal(null); 
                setUserDetailsModalType(null);
                setSelectedUserCard(null);
              }}>✕</button>
            </div>
            
            <div className="balance-modal-body">
              {referralsLoading ? (
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div className="loading-spinner"></div>
                  <p>Referrallar yuklanmoqda...</p>
                </div>
              ) : userReferrals && userReferrals.length > 0 ? (
                <div className="referrals-section">
                  <h4 style={{marginBottom: '12px', color: '#667eea'}}>👥 Jami: {userReferrals.length} ta</h4>
                  <div className="referrals-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {userReferrals.map((ref) => (
                      <div 
                        key={ref.id} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px',
                          marginBottom: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{color: '#667eea', fontWeight: 'bold'}}>@{ref.username}</span>
                            <span style={{color: 'rgba(255,255,255,0.6)'}}>
                              Sub: {ref.subscribe_user ? "✅" : "❌"}
                            </span>
                          </div>
                          <div style={{color: '#999', fontSize: '11px', marginTop: '4px'}}>
                            📅 {new Date(ref.created_at).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => removeReferral(ref.id)}
                          style={{
                            background: '#ff4757',
                            border: 'none',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginLeft: '8px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          🗑️ O'chirish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                  <div style={{fontSize: '24px', marginBottom: '8px'}}>👥</div>
                  <p>Hech qanday referral yo'q</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== BALANCE ADJUSTMENT MODAL ==================== */}
      {balanceModal && (
        <div className="balance-modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="balance-modal-header">
              <h3>💰 Balans o'zgartirish</h3>
              <button className="modal-close" onClick={() => setBalanceModal(null)}>✕</button>
            </div>
            
            <div className="balance-modal-body">
              <div className="balance-user-info">
                <span className="balance-username">@{balanceModal.username}</span>
                <span className="balance-current">Joriy balans: <b>{balanceModal.currentBalance} ⭐</b></span>
              </div>

              <div className="balance-input-group">
                <label>Miqdor</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Miqdorni kiriting..."
                  min="1"
                  disabled={balanceLoading}
                />
              </div>

              <div className="balance-actions">
                <button 
                  className="balance-btn add"
                  onClick={() => adjustBalance("add")}
                  disabled={balanceLoading || !balanceAmount}
                >
                  {balanceLoading ? "⏳" : "➕"} Qo'shish
                </button>
                <button 
                  className="balance-btn subtract"
                  onClick={() => adjustBalance("subtract")}
                  disabled={balanceLoading || !balanceAmount}
                >
                  {balanceLoading ? "⏳" : "➖"} Ayirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==================== SOM BALANCE ADJUSTMENT MODAL ==================== */}
      {somBalanceModal && (
        <div className="balance-modal-overlay" onClick={() => setSomBalanceModal(null)}>
          <div className="balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="balance-modal-header">
              <h3>💵 Som balans o'zgartirish</h3>
              <button className="modal-close" onClick={() => setSomBalanceModal(null)}>✕</button>
            </div>

            <div className="balance-modal-body">
              <div className="balance-user-info">
                <span className="balance-username">@{somBalanceModal.username}</span>
                <span className="balance-current">Joriy balans: <b>{somBalanceModal.currentBalance.toLocaleString()} so'm</b></span>
              </div>

              <div className="balance-input-group">
                <label>Miqdor (so'm)</label>
                <input
                  type="number"
                  value={somBalanceAmount}
                  onChange={(e) => setSomBalanceAmount(e.target.value)}
                  placeholder="Miqdorni kiriting..."
                  min="1"
                  disabled={somBalanceLoading}
                />
              </div>

              <div className="balance-actions">
                <button
                  className="balance-btn add"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  onClick={() => adjustSomBalance("add")}
                  disabled={somBalanceLoading || !somBalanceAmount}
                >
                  {somBalanceLoading ? "⏳" : "➕"} Qo'shish
                </button>
                <button
                  className="balance-btn subtract"
                  onClick={() => adjustSomBalance("subtract")}
                  disabled={somBalanceLoading || !somBalanceAmount}
                >
                  {somBalanceLoading ? "⏳" : "➖"} Ayirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
