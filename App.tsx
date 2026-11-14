import React, { useState, useEffect, useRef } from 'react';
import { Tab, ShoppingItem, ExpenseRecord, ChecklistItem, DayWeather } from './types';
import { TRIP } from './trip.config';
import { LOCATION_DETAILS, TODO_LIST, PACKING_CARRY_ON, PACKING_CHECKED, WEATHER_SPOTS, ITINERARY } from './trip.data';
import { GOOGLE_SCRIPT_URL } from './lib/env';
import { localIsoDate, todayTripIndex } from './lib/tripDates';
import { readStored, writeStored } from './lib/storage';
import { ItineraryView } from './views/ItineraryView';
import { PrepView } from './views/PrepView';
import { PackingView } from './views/PackingView';
import { DetailView } from './views/DetailView';
import { InfoView } from './views/InfoView';
import { ShoppingView } from './views/ShoppingView';
import { CostView } from './views/CostView';
import { fetchExpenses as fetchExpenseRecords, UnauthorizedError, consumeKeyFromUrl } from './lib/expenseApi';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';

/** 自己新增的項目 id 是 `<prefix>_<時間戳>`，內建的是 `<prefix>_1`、`<prefix>_2`… */
const isUserAdded = (id: string) => /_\d{10,}$/.test(id);

/**
 * 內建清單（待辦、隨身、托運）改版時（trip.config.ts 的 seedVersion 變了），
 * 把新的內建項目換上去，並保留使用者自己加的。
 * 刪掉的內建項目會消失，改過字的內建項目會被改回官方版本——
 * 這是刻意的，內建清單的內容以程式碼為準。打勾紀錄不受影響。
 */
function getSeededList(name: string, seed: ChecklistItem[]): ChecklistItem[] {
  const stored = readStored<ChecklistItem[] | null>(name, null);
  if (!stored) return seed;
  if (readStored<string | null>('seed_version', null) === TRIP.seedVersion) return stored;
  return [...seed, ...stored.filter(item => isUserAdded(item.id))];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);

  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(readStored<string[]>('checked_items', []))
  );

  useEffect(() => { writeStored('checked_items', Array.from(checkedItems)); }, [checkedItems]);

  const [todoList, setTodoList] = useState<ChecklistItem[]>(() =>
    getSeededList('dynamic_todo_list', TODO_LIST)
  );

  const [carryOnList, setCarryOnList] = useState<ChecklistItem[]>(() =>
    getSeededList('dynamic_carryon_list', PACKING_CARRY_ON)
  );

  const [checkedBagList, setCheckedBagList] = useState<ChecklistItem[]>(() =>
    getSeededList('dynamic_checkedbag_list', PACKING_CHECKED)
  );

  // 三份清單都讀完才記錄版本，中途失敗下次會重來
  useEffect(() => { writeStored('seed_version', TRIP.seedVersion); }, []);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(
    () => readStored<ShoppingItem[]>('shopping_list', [])
  );

  useEffect(() => { writeStored('dynamic_todo_list', todoList); }, [todoList]);
  useEffect(() => { writeStored('dynamic_carryon_list', carryOnList); }, [carryOnList]);
  useEffect(() => { writeStored('dynamic_checkedbag_list', checkedBagList); }, [checkedBagList]);
  useEffect(() => { writeStored('shopping_list', shoppingList); }, [shoppingList]);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  // 出發前先停在第一天，旅途中直接開在今天——每天打開不用再自己點日期
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(() => Math.max(0, todayTripIndex()));

  const lastSeenDayRef = useRef<string>(localIsoDate());
  const [weatherEpoch, setWeatherEpoch] = useState(0);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [needsAccessKey, setNeedsAccessKey] = useState(false);
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DayWeather>>({});

  // 用 #key=... 的解鎖連結打開時，收下密鑰並把網址清乾淨
  useEffect(() => { consumeKeyFromUrl(); }, []);

  useEffect(() => {
    // Scroll the main content area back to top on tab switch
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [activeTab]);

  /* 每天待的城市不同（見 trip.data.ts 的 WEATHER_SPOTS），各查各的「此刻」氣溫——
     要的是現在幾度，不是預報。
     Open-Meteo 傳多組經緯度就回傳陣列，一次請求把每天的城市都拿回來。 */
  useEffect(() => {
    const fetchWeather = async () => {
      const params = new URLSearchParams({
        latitude: WEATHER_SPOTS.map(s => s.latitude).join(','),
        longitude: WEATHER_SPOTS.map(s => s.longitude).join(','),
        current: 'temperature_2m,weather_code',
        timezone: TRIP.timezone,
      });

      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`天氣 API ${res.status}`);
        const payload = await res.json();
        // 單一地點回傳物件、多地點回傳陣列，統一成陣列處理
        const places = Array.isArray(payload) ? payload : [payload];

        const next: Record<string, DayWeather> = {};
        WEATHER_SPOTS.forEach((spot, i) => {
          const current = places[i]?.current;
          if (!current) return;
          next[spot.date] = {
            label: spot.label,
            code: current.weather_code,
            temp: Math.round(current.temperature_2m),
          };
        });
        setWeatherByDate(next);
      } catch (e) {
        // 天氣抓不到就不顯示膠囊，不擋行程
        console.error('天氣載入失敗', e);
      }
    };

    fetchWeather();
  }, [weatherEpoch]);

  /* 回到前景就重抓氣溫（放著會過時），跨日的話順便跳到當天。
     跳日期只在「日期真的變了」才做，不會在使用者翻看其他天時把畫面搶走。 */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setWeatherEpoch(n => n + 1);

      const today = localIsoDate();
      if (today === lastSeenDayRef.current) return;
      lastSeenDayRef.current = today;
      const idx = todayTripIndex();
      if (idx >= 0) setSelectedDateIdx(idx);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const fetchExpenses = async () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsExpensesLoading(true);
    setExpensesError(null);
    try {
      setExpenses(await fetchExpenseRecords());
      setNeedsAccessKey(false);
    } catch (err: any) {
      // 密鑰不對是「還沒解鎖」，不是壞掉，要引導輸入而不是丟錯誤訊息
      if (err instanceof UnauthorizedError) { setNeedsAccessKey(true); setExpensesError(null); }
      else setExpensesError(err.message || '讀取失敗');
    }
    finally { setIsExpensesLoading(false); }
  };

  useEffect(() => { if (activeTab === Tab.COST && expenses.length === 0) fetchExpenses(); }, [activeTab]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col overflow-hidden font-sans text-ink bg-washi-white" style={{ height: 'var(--app-height, 100dvh)' }}>
      {selectedLocationId && LOCATION_DETAILS[selectedLocationId] && (
        <div className="absolute inset-0 z-50">
          <DetailView location={LOCATION_DETAILS[selectedLocationId]} onBack={() => setSelectedLocationId(null)} />
        </div>
      )}

      <Header weather={weatherByDate[ITINERARY[selectedDateIdx].date] ?? null} />

      <main
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-washi-white"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {activeTab === Tab.ITINERARY && (
          <ItineraryView
            onNavigateToDetail={setSelectedLocationId}
            selectedDateIdx={selectedDateIdx}
            setSelectedDateIdx={setSelectedDateIdx}
          />
        )}
        {activeTab !== Tab.ITINERARY && (
          <div className="px-4">
            {activeTab === Tab.PREP && (
              <PrepView checkedItems={checkedItems} toggleItem={toggleItem} list={todoList} setList={setTodoList} />
            )}
            {activeTab === Tab.PACKING && (
              <PackingView
                checkedItems={checkedItems}
                toggleItem={toggleItem}
                carryOnList={carryOnList}
                setCarryOnList={setCarryOnList}
                checkedBagList={checkedBagList}
                setCheckedBagList={setCheckedBagList}
              />
            )}
            {activeTab === Tab.SHOPPING && (
              <ShoppingView items={shoppingList} setItems={setShoppingList} />
            )}
            {activeTab === Tab.COST && (
              <CostView
                expenses={expenses}
                isLoading={isExpensesLoading}
                fetchError={expensesError}
                needsAccessKey={needsAccessKey}
                onUnlocked={fetchExpenses}
                onRefresh={fetchExpenses}
                onAddSuccess={fetchExpenses}
              />
            )}
            {activeTab === Tab.INFO && (
              <InfoView />
            )}
          </div>
        )}
      </main>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default App;
