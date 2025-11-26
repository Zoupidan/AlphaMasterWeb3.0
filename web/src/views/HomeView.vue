<template>
  <div class="home">
    <div class="header">
      <h1>Alpha 积分管理系统</h1>
    </div>
    
    <div class="main-content">
      <!-- Calendar Section -->
      <div class="calendar-card card">
        <div class="month-navigation">
          <button @click="prevMonth" class="nav-btn">上一月</button>
          <h2 class="month-title">{{ currentMonthYear }}</h2>
          <button @click="nextMonth" class="nav-btn">下一月</button>
        </div>
        
        <div class="weekdays">
          <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
        </div>
        
        <div class="calendar-grid">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            :class="['calendar-day', { 
              'empty': !day.number, 
              'today': day.isToday,
              'has-data': day.hasData,
              'valid-15': day.isValid15,
              'modified': day.isModified,
              'selected': day.isSelected 
            }]"
            @click="selectDate(day)"
            @dblclick="openInputDialog(day)"
          >
            <span v-if="day.number">{{ day.number }}</span>
            <div v-if="day.isToday" class="today-indicator"></div>
            <div v-if="day.hasData" :class="['status-indicator', { 'modified': day.isModified }]"></div>
          </div>
        </div>
      </div>
      
      <!-- Today Stats Section -->
      <div class="today-card card">
        <div class="today-header">
          <h2>当日数据：</h2>
          <span class="selected-date">{{ selectedDateText }}</span>
          <button class="options-btn" @click="openThemeDialog">
            <img src="/icons/setting_32px.ico" alt="设置" class="settings-icon" />
          </button>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card" v-for="stat in stats" :key="stat.label">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Input Dialog -->
    <div v-if="showInputDialog" class="modal-overlay" @click="closeInputDialog">
      <div class="input-dialog card" @click.stop>
        <div class="dialog-header">
          <h3>{{ inputDialogTitle }}</h3>
          <button class="close-btn" @click="closeInputDialog">×</button>
        </div>
        
        <!-- Tabs -->
        <div class="tabs-row">
          <button 
            :class="['tab-btn', { active: activeTab === 'calc' }]" 
            @click="setActiveTab('calc')"
          >
            <img src="/icons/2.ico" alt="计算" class="tab-icon" />
            计算
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'use' }]" 
            @click="setActiveTab('use')"
          >
            <img src="/icons/7.ico" alt="使用" class="tab-icon" />
            使用
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'edit' }]" 
            @click="setActiveTab('edit')"
          >
            <img src="/icons/8.ico" alt="修改" class="tab-icon" />
            修改
          </button>
        </div>
        
        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Calc/Use Form -->
          <div v-if="activeTab === 'calc' || activeTab === 'use'" class="form-section">
            <h4 v-if="activeTab === 'calc'">输入当日数据</h4>
            <h4 v-if="activeTab === 'use'">使用积分与代币</h4>
            
            <div class="form-group" v-if="activeTab === 'calc'">
              <label>初始资金</label>
              <input v-model="formData.initBalance" type="number" placeholder="例如 1000" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'calc'">
              <label>完成资金</label>
              <input v-model="formData.finalBalance" type="number" placeholder="例如 1200" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'calc'">
              <label>交易量</label>
              <input v-model="formData.transaction" type="number" placeholder="例如 200" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'use'">
              <label>代币名称</label>
              <input v-model="formData.tokenName" type="text" placeholder="例如 BTC" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'use'">
              <label>代币数量</label>
              <input v-model="formData.tokenQty" type="number" placeholder="例如 0.05" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'use'">
              <label>代币价值</label>
              <input v-model="formData.tokenVal" type="number" placeholder="例如 68000" />
            </div>
            
            <div class="form-group" v-if="activeTab === 'use'">
              <label>使用积分</label>
              <input v-model="formData.usedPts" type="number" placeholder="例如 10" />
            </div>
            
            <div class="form-group">
              <label>时间</label>
              <input v-model="formData.timestamp" type="datetime-local" />
            </div>
          </div>
          
          <!-- Edit Form -->
          <div v-if="activeTab === 'edit'" class="form-section">
            <h4>修改当日数据</h4>
            
            <div class="form-group">
              <label>选择条目</label>
              <select v-model="selectedEntryIndex">
                <option v-for="(entry, index) in currentDayEntries" :key="index" :value="index">
                  {{ getEntryLabel(entry) }}
                </option>
              </select>
            </div>
            
            <div class="form-group" v-if="isCurrentEntryCalcType">
              <label>初始资金</label>
              <input v-model="formData.initBalance" type="number" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryCalcType">
              <label>完成资金</label>
              <input v-model="formData.finalBalance" type="number" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryCalcType">
              <label>交易量</label>
              <input v-model="formData.transaction" type="number" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryUseType">
              <label>代币名称</label>
              <input v-model="formData.tokenName" type="text" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryUseType">
              <label>代币数量</label>
              <input v-model="formData.tokenQty" type="number" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryUseType">
              <label>代币价值</label>
              <input v-model="formData.tokenVal" type="number" />
            </div>
            
            <div class="form-group" v-if="isCurrentEntryUseType">
              <label>使用积分</label>
              <input v-model="formData.usedPts" type="number" />
            </div>
            
            <div class="form-group">
              <label>磨损</label>
              <input v-model="formData.wear" type="number" />
            </div>
            
            <div class="form-group">
              <label>余额积分</label>
              <input v-model="formData.balancePts" type="number" />
            </div>
            
            <div class="form-group">
              <label>交易积分</label>
              <input v-model="formData.txnPts" type="number" />
            </div>
            
            <div class="form-group">
              <label>利润</label>
              <input v-model="formData.profit" type="number" />
            </div>
            
            <div class="form-group">
              <label>时间</label>
              <input v-model="formData.timestamp" type="datetime-local" />
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="dialog-actions">
          <button 
            v-if="activeTab === 'calc'" 
            class="primary-btn" 
            @click="saveCalcData"
          >
            <img src="/icons/2.ico" alt="" class="btn-icon" />
            计算保存
          </button>
          <button 
            v-if="activeTab === 'use'" 
            class="primary-btn" 
            @click="saveUseData"
          >
            <img src="/icons/7.ico" alt="" class="btn-icon" />
            保存使用
          </button>
          <button 
            v-if="activeTab === 'edit'" 
            class="primary-btn" 
            @click="saveEditData"
          >
            <img src="/icons/8.ico" alt="" class="btn-icon" />
            保存修改
          </button>
        </div>
      </div>
    </div>
    
    <div class="summary-section card">
      <div class="summary-item" v-for="item in summaries" :key="item.title">
        <h3>{{ item.title }}</h3>
        <div class="summary-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { computeWear, computeBalancePts, computeTxnPts, computeProfitGross, computeProfitNet } from '@/utils/TokenCalcService.js';

export default {
  name: 'HomeView',
  setup() {
    // Current date state
    const currentDate = new Date();
    const currentMonth = ref(currentDate.getMonth());
    const currentYear = ref(currentDate.getFullYear());
    const selectedDate = ref(new Date());
    
    // Input dialog state
    const showInputDialog = ref(false);
    const activeTab = ref('calc');
    const inputDialogTitle = ref('当日数据输入');
    
    // Form data
    const formData = ref({
      initBalance: '',
      finalBalance: '',
      transaction: '',
      tokenName: '',
      tokenQty: '',
      tokenVal: '',
      usedPts: '',
      wear: '',
      balancePts: '',
      txnPts: '',
      profit: '',
      timestamp: ''
    });
    
    // Entry selection for edit tab
    const selectedEntryIndex = ref(0);
    
    // Sample data for demonstration
    const sampleData = {
      '2025-11-20': { 
        hasData: true,
        isValid15: true,
        isModified: false,
        entries: [
          {
            entryType: 'calc',
            initBalance: 1000,
            finalBalance: 950,
            transaction: 50000,
            timestamp: '2025-11-20T10:30'
          }
        ]
      },
      '2025-11-25': { 
        hasData: true,
        isValid15: true,
        isModified: true,
        entries: [
          {
            entryType: 'calc',
            initBalance: 1200,
            finalBalance: 1150,
            transaction: 60000,
            timestamp: '2025-11-25T09:15'
          },
          {
            entryType: 'use',
            tokenName: 'BTC',
            tokenQty: 0.1,
            tokenVal: 70000,
            usedPts: 10,
            timestamp: '2025-11-25T15:45'
          }
        ]
      },
      '2025-11-26': { 
        hasData: true, 
        isToday: true,
        isValid15: true,
        isModified: false,
        entries: []
      }
    };
    
    // Stats data
    const stats = ref([
      { label: '初始资金', value: '—' },
      { label: '完成资金', value: '—' },
      { label: '磨损金额', value: '—' },
      { label: '代币名称', value: '—' },
      { label: '余额积分', value: '—' },
      { label: '交易积分', value: '—' },
      { label: '当日积分', value: '—' },
      { label: '利润', value: '—' }
    ]);
    
    // Summary data
    const summaries = ref([
      { title: '总磨损', value: '0.000' },
      { title: '净利润', value: '0.000' },
      { title: '有效积分', value: '0' },
      { title: '总交易量', value: '0' },
      { title: '磨损率', value: '0.000000%' }
    ]);
    
    // Weekday labels (Monday to Sunday)
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    
    // Computed properties
    const currentMonthYear = computed(() => {
      return `${currentYear.value} 年 ${String(currentYear.value)}月`;
    });
    
    const selectedDateText = computed(() => {
      const date = selectedDate.value;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    
    // Calendar days array
    const calendarDays = computed(() => {
      const year = currentYear.value;
      const month = currentMonth.value;
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      // Day of week for the first day (0 = Sunday, 1 = Monday, etc.)
      let startDay = firstDay.getDay();
      // Adjust for Monday as first day
      startDay = startDay === 0 ? 6 : startDay - 1;
      
      // Days in month
      const daysInMonth = lastDay.getDate();
      
      // Create calendar days array
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startDay; i++) {
        days.push({ number: null });
      }
      
      // Add days of the month
      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayData = sampleData[dateStr] || {};
        
        const isToday = (
          today.getFullYear() === year &&
          today.getMonth() === month &&
          today.getDate() === i
        );
        
        days.push({
          number: i,
          date: new Date(year, month, i),
          isToday: isToday,
          hasData: dayData.hasData || false,
          isValid15: dayData.isValid15 || false,
          isModified: dayData.isModified || false,
          isSelected: (
            selectedDate.value.getFullYear() === year &&
            selectedDate.value.getMonth() === month &&
            selectedDate.value.getDate() === i
          )
        });
      }
      
      return days;
    });
    
    // Current day entries for edit tab
    const currentDayEntries = computed(() => {
      const dateStr = selectedDateText.value;
      const dayData = sampleData[dateStr] || {};
      return dayData.entries || [];
    });
    
    // Check if current entry is calc type
    const isCurrentEntryCalcType = computed(() => {
      if (currentDayEntries.value.length === 0) return false;
      const entry = currentDayEntries.value[selectedEntryIndex.value] || {};
      return entry.entryType === 'calc';
    });
    
    // Check if current entry is use type
    const isCurrentEntryUseType = computed(() => {
      if (currentDayEntries.value.length === 0) return false;
      const entry = currentDayEntries.value[selectedEntryIndex.value] || {};
      return entry.entryType === 'use';
    });
    
    // Methods
    const prevMonth = () => {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else {
        currentMonth.value--;
      }
    };
    
    const nextMonth = () => {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else {
        currentMonth.value++;
      }
    };
    
    const selectDate = (day) => {
      if (day.date) {
        selectedDate.value = day.date;
      }
    };
    
    const openInputDialog = (day) => {
      if (day.date) {
        selectedDate.value = day.date;
        // Check if selected date is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(day.date);
        selected.setHours(0, 0, 0, 0);
        
        // For non-today dates, only allow edit tab
        if (selected.getTime() !== today.getTime()) {
          activeTab.value = 'edit';
          inputDialogTitle.value = `修改数据 - ${formatDate(day.date)}`;
        } else {
          activeTab.value = 'calc';
          inputDialogTitle.value = `当日数据输入 - ${formatDate(day.date)}`;
        }
        
        showInputDialog.value = true;
      }
    };
    
    const closeInputDialog = () => {
      showInputDialog.value = false;
    };
    
    const setActiveTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'calc') {
        inputDialogTitle.value = `当日数据输入 - ${formatDate(selectedDate.value)}`;
      } else if (tab === 'use') {
        inputDialogTitle.value = `当日数据输入 - ${formatDate(selectedDate.value)}`;
      } else if (tab === 'edit') {
        inputDialogTitle.value = `修改数据 - ${formatDate(selectedDate.value)}`;
      }
    };
    
    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const getEntryLabel = (entry) => {
      if (!entry.timestamp) return '未标注时间';
      
      const date = new Date(entry.timestamp);
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      if (entry.entryType === 'calc') {
        return `增加 ${timeStr}`;
      } else if (entry.entryType === 'use') {
        const name = entry.tokenName || '未命名';
        return `${name} ${timeStr}`;
      } else {
        return `${entry.entryType} ${timeStr}`;
      }
    };
    
    const openThemeDialog = () => {
      // Open theme dialog functionality
      console.log('Opening theme dialog');
    };
    
    const saveCalcData = () => {
      // Save calculation data
      console.log('Saving calculation data:', formData.value);
      closeInputDialog();
    };
    
    const saveUseData = () => {
      // Save use data
      console.log('Saving use data:', formData.value);
      closeInputDialog();
    };
    
    const saveEditData = () => {
      // Save edit data
      console.log('Saving edit data:', formData.value);
      closeInputDialog();
    };
    
    // New method to demonstrate calculation logic
    const calculateExample = () => {
      // Example calculations using the same logic as the desktop app
      const initBalance = 1000;
      const finalBalance = 950;
      const transaction = 50000;
      
      // Calculate wear (difference between initial and final balance)
      const wear = computeWear(initBalance, finalBalance, null);
      
      // Calculate balance points based on final balance
      const balancePts = computeBalancePts(finalBalance, null);
      
      // Calculate transaction points based on transaction amount
      const txnPts = computeTxnPts(transaction, null);
      
      // Calculate profit
      const qty = 10;
      const val = 50;
      const profitGross = computeProfitGross(qty, val);
      const profitNet = computeProfitNet(profitGross, wear, null);
      
      console.log('Calculation results:', {
        initBalance,
        finalBalance,
        wear,
        balancePts,
        transaction,
        txnPts,
        qty,
        val,
        profitGross,
        profitNet
      });
    };
    
    // Call the example to show it works
    calculateExample();
    
    return {
      weekdays,
      currentMonthYear,
      calendarDays,
      selectedDateText,
      stats,
      summaries,
      showInputDialog,
      activeTab,
      inputDialogTitle,
      formData,
      selectedEntryIndex,
      currentDayEntries,
      isCurrentEntryCalcType,
      isCurrentEntryUseType,
      prevMonth,
      nextMonth,
      selectDate,
      openInputDialog,
      closeInputDialog,
      setActiveTab,
      getEntryLabel,
      openThemeDialog,
      saveCalcData,
      saveUseData,
      saveEditData
    };
  }
};
</script>

<style scoped>
.home {
  padding: 16px 12px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.header h1 {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #0f172a;
}

.main-content {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.64);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 6px 20px rgba(2, 8, 23, 0.4);
}

.calendar-card {
  flex: 1;
  min-width: 300px;
}

.today-card {
  flex: 1;
  min-width: 300px;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.month-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.nav-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.64);
  background: #ffffff;
  cursor: pointer;
}

.nav-btn:hover {
  background: #f9fafb;
}

.weekdays {
  display: flex;
  margin-bottom: 8px;
}

.weekday {
  flex: 1;
  text-align: center;
  padding: 4px;
  font-size: 14px;
  color: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #000;
}

.calendar-day:hover:not(.empty) {
  background: rgba(96, 165, 250, 0.2);
}

.calendar-day.has-data:not(.valid-15) {
  background: linear-gradient(to bottom right, #47559b, #475555);
  color: white;
}

.calendar-day.has-data.valid-15 {
  background: linear-gradient(to bottom right, #60a5fa, #3b82f6);
  color: white;
}

.calendar-day.today::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 6px;
  height: 6px;
  background: #50cc09;
  border-radius: 50%;
}

.calendar-day.selected {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.today-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 6px;
  height: 6px;
  background: #50cc09;
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #a7f3d0;
  border-radius: 50%;
}

.status-indicator.modified {
  background: #fbcfe8;
}

.today-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.today-header h2 {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #0f172a;
}

.selected-date {
  font-size: 16px;
  font-weight: bold;
  color: #0f172a;
}

.options-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-icon {
  width: 20px;
  height: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.64);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 6px 14px rgba(2, 8, 23, 0.4);
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}

.summary-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-item {
  flex: 1;
  min-width: 150px;
  text-align: center;
  padding: 12px;
}

.summary-item h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 6px 0;
  color: #0f172a;
}

.summary-value {
  font-size: 22px;
  font-weight: bold;
  color: #0f172a;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.input-dialog {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.tabs-row {
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.64);
  background: #ffffff;
  cursor: pointer;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.64);
  border-radius: 4px;
  box-sizing: border-box;
}

.dialog-actions {
  margin-top: 16px;
  text-align: center;
}

.primary-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary-btn:hover {
  background: #2563eb;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-section {
    flex-direction: column;
  }
  
  .summary-item {
    min-width: unset;
  }
  
  .tabs-row {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .home {
    padding: 12px 8px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .month-navigation {
    flex-direction: column;
    gap: 8px;
  }
  
  .month-title {
    order: -1;
  }
}
</style>