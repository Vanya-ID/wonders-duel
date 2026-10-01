import type { GameMode } from '../domain/types'
import { hasAgora, hasPantheon } from './modes'

export type Expansion = 'base' | 'pantheon' | 'agora'

export interface RefItem {
  id: string
  name: string
  nameEn?: string
  cost?: string
  points?: number
  effect: string
  tag?: string
  note?: string
}

export interface RefSection {
  id: string
  title: string
  expansion: Expansion
  replacedBy?: Expansion
  intro?: string
  items: RefItem[]
}

export const isExpansionInMode = (expansion: Expansion, mode: GameMode): boolean =>
  expansion === 'base' || (expansion === 'pantheon' ? hasPantheon(mode) : hasAgora(mode))

export const isSectionInMode = (section: RefSection, mode: GameMode): boolean =>
  isExpansionInMode(section.expansion, mode) && !(section.replacedBy && isExpansionInMode(section.replacedBy, mode))

const RESOURCE_NAMES: Record<string, string> = {
  Д: 'древесина',
  Г: 'глина',
  К: 'камень',
  С: 'стекло',
  П: 'папирус',
}

export const formatCost = (cost: string): string => {
  const counts = new Map<string, number>()
  for (const symbol of cost) {
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([symbol, count]) => `${RESOURCE_NAMES[symbol] ?? symbol}${count > 1 ? ` ×${count}` : ''}`)
    .join(', ')
}

const WONDERS: RefItem[] = [
  { id: 'appian_way', name: 'Аппиева дорога', nameEn: 'The Appian Way', cost: 'ПГГКК', points: 3, effect: 'Возьмите 3 монеты из банка, соперник теряет 3 монеты. Ещё один ход.' },
  { id: 'circus_maximus', name: 'Большой цирк', nameEn: 'Circus Maximus', cost: 'СДКК', points: 3, effect: 'Сбросьте одну построенную соперником серую карту. 1 Щит.' },
  { id: 'colossus', name: 'Колосс Родосский', nameEn: 'The Colossus', cost: 'СГГГ', points: 3, effect: '2 Щита.' },
  { id: 'great_library', name: 'Александрийская библиотека', nameEn: 'The Great Library', cost: 'ПСДДД', points: 4, effect: 'Случайно возьмите 3 жетона Развития из отложенных при подготовке, разыграйте один, два верните в коробку.' },
  { id: 'great_lighthouse', name: 'Александрийский маяк', nameEn: 'The Great Lighthouse', cost: 'ППКД', points: 4, effect: 'Каждый ход производит 1 единицу на выбор: камень, глину или древесину. На цены торговли для соперника не влияет.' },
  { id: 'hanging_gardens', name: 'Висячие сады Семирамиды', nameEn: 'The Hanging Gardens', cost: 'ПСДД', points: 3, effect: 'Возьмите 6 монет из банка. Ещё один ход.' },
  { id: 'mausoleum', name: 'Мавзолей в Галикарнасе', nameEn: 'The Mausoleum', cost: 'ПССГГ', points: 2, effect: 'Возьмите все карты из сброса, выберите одну и бесплатно постройте. Карты, убранные при подготовке, сбросом не считаются.' },
  { id: 'piraeus', name: 'Пирей', nameEn: 'Piraeus', cost: 'ГКДД', points: 2, effect: 'Каждый ход производит 1 единицу на выбор: стекло или папирус. На цены торговли не влияет. Ещё один ход.' },
  { id: 'pyramids', name: 'Пирамида Хеопса', nameEn: 'The Pyramids', cost: 'ПККК', points: 9, effect: 'Только победные очки.' },
  { id: 'sphinx', name: 'Большой сфинкс', nameEn: 'The Sphinx', cost: 'ССГК', points: 6, effect: 'Ещё один ход.' },
  { id: 'statue_of_zeus', name: 'Статуя Зевса в Олимпии', nameEn: 'The Statue of Zeus', cost: 'ППГДК', points: 3, effect: 'Сбросьте одну построенную соперником коричневую карту. 1 Щит.' },
  { id: 'temple_of_artemis', name: 'Храм Артемиды в Эфесе', nameEn: 'The Temple of Artemis', cost: 'ПСКД', points: 0, effect: 'Возьмите 12 монет из банка. Ещё один ход.' },
]

const WONDERS_PANTHEON: RefItem[] = [
  { id: 'sanctuary', name: 'Святилище', nameEn: 'The Sanctuary', cost: 'ПСКК', points: 0, effect: 'Активация карт Пантеона для вас на 2 монеты дешевле. Ещё один ход.' },
  { id: 'divine_theater', name: 'Божественный театр', nameEn: 'The Divine Theater', cost: 'ППСДД', points: 2, effect: 'Откройте все карты одной стопки Мифологии на выбор, бесплатно активируйте одну, остальные верните в любом порядке.' },
]

const WONDERS_AGORA: RefItem[] = [
  { id: 'curia_julia', name: 'Курия Юлия', nameEn: 'Curia Julia', cost: 'ПСГДК', points: 0, effect: 'При выборе Чуда: возьмите 2 Заговора, один оставьте лицом вниз, другой — наверх или под низ колоды. При постройке: можете осуществить один свой неподготовленный Заговор; возьмите 6 монет; ещё один ход.' },
  { id: 'knossos', name: 'Кносский дворец', nameEn: 'Knossos', cost: 'ССГДК', points: 3, effect: 'При выборе Чуда: положите 1 свой кубик Влияния в любую Палату. При постройке: 1 кубик в любую Палату и по желанию переместите 1 кубик в соседнюю.' },
]

const PROGRESS: RefItem[] = [
  { id: 'agriculture', name: 'Земледелие', nameEn: 'Agriculture', points: 4, effect: 'Сразу возьмите 6 монет. Жетон даёт 4 ПО.' },
  { id: 'architecture', name: 'Архитектура', nameEn: 'Architecture', effect: 'Будущие Чудеса стоят на 2 ресурса меньше (ресурсы выбираете каждый раз).' },
  { id: 'economy', name: 'Экономика', nameEn: 'Economy', effect: 'Монеты, которые соперник тратит на покупку ресурсов, получаете вы (кроме монет из стоимости карты).' },
  { id: 'law', name: 'Закон', nameEn: 'Law', effect: 'Считается научным символом.' },
  { id: 'masonry', name: 'Каменная кладка', nameEn: 'Masonry', effect: 'Будущие синие карты стоят на 2 ресурса меньше.' },
  { id: 'mathematics', name: 'Математика', nameEn: 'Mathematics', effect: 'В конце игры 3 ПО за каждый ваш жетон Развития, включая этот.' },
  { id: 'philosophy', name: 'Философия', nameEn: 'Philosophy', points: 7, effect: '7 ПО.' },
  { id: 'strategy', name: 'Стратегия', nameEn: 'Strategy', effect: 'Красные карты, построенные после получения жетона, дают на 1 Щит больше (не Чудеса).' },
  { id: 'theology', name: 'Теология', nameEn: 'Theology', effect: 'Будущие Чудеса дают «ещё один ход» (не больше одного дополнительного хода на Чудо).' },
  { id: 'urbanism', name: 'Урбанизм', nameEn: 'Urbanism', effect: 'Сразу возьмите 6 монет. +4 монеты за каждую постройку по цепочке.' },
]

const PROGRESS_PANTHEON: RefItem[] = [
  { id: 'mysticism', name: 'Мистицизм', nameEn: 'Mysticism', effect: 'В конце игры 2 ПО за каждый оставшийся у вас жетон Мифологии и Жертвоприношения.' },
  { id: 'poliorcetics', name: 'Осадная техника', nameEn: 'Poliorcetics', effect: 'Каждый раз, когда вы двигаете маркер Конфликта к городу соперника, он теряет 1 монету за каждое пройденное деление.' },
  { id: 'engineering', name: 'Инженерное дело', nameEn: 'Engineering', effect: 'За 1 монету можно построить любую карту с символом цепочки под стоимостью, даже без нужного здания или жетона.' },
]

const PROGRESS_AGORA: RefItem[] = [
  { id: 'corruption', name: 'Коррупция', nameEn: 'Corruption', effect: 'С этого момента все Сенаторы нанимаются бесплатно.' },
  { id: 'organized_crime', name: 'Организованная преступность', nameEn: 'Organized Crime', effect: 'Беря 2 карты Заговоров, оставляйте обе.' },
]

const GUILDS: RefItem[] = [
  { id: 'guild_builders', name: 'Гильдия строителей', nameEn: 'Builders Guild', cost: 'ККГДС', effect: 'Конец игры: 2 ПО за каждое Чудо в городе с наибольшим числом Чудес.' },
  { id: 'guild_moneylenders', name: 'Гильдия ростовщиков', nameEn: 'Moneylenders Guild', cost: 'ККДД', effect: 'Конец игры: 1 ПО за каждые 3 монеты в самом богатом городе.' },
  { id: 'guild_scientists', name: 'Гильдия учёных', nameEn: 'Scientists Guild', cost: 'ГГДД', effect: 'При постройке: 1 монета за каждую зелёную карту в городе с наибольшим их числом. Конец игры: 1 ПО за каждую такую карту там же.' },
  { id: 'guild_shipowners', name: 'Гильдия судовладельцев', nameEn: 'Shipowners Guild', cost: 'ГКСП', effect: 'То же для коричневых и серых карт вместе (один город для обоих цветов).' },
  { id: 'guild_traders', name: 'Гильдия торговцев', nameEn: 'Traders Guild', cost: 'ГДСП', effect: 'То же для жёлтых карт.' },
  { id: 'guild_magistrates', name: 'Гильдия судей', nameEn: 'Magistrates Guild', cost: 'ДДГП', effect: 'То же для синих карт.' },
  { id: 'guild_tacticians', name: 'Гильдия стратегов', nameEn: 'Tacticians Guild', cost: 'ККГП', effect: 'То же для красных карт.', note: 'В тексте правил базы — «Гильдия тактиков».' },
]

const GODS: RefItem[] = [
  { id: 'enki', name: 'Энки', nameEn: 'Enki', tag: 'Месопотамия', effect: 'Когда карту открывают, на неё кладут 2 случайных жетона Развития из отложенных при подготовке. При активации возьмите один, второй — в коробку.' },
  { id: 'ishtar', name: 'Иштар', nameEn: 'Ishtar', tag: 'Месопотамия', effect: 'Даёт научный символ (как у жетона «Закон»).' },
  { id: 'nisaba', name: 'Нисаба', nameEn: 'Nisaba', tag: 'Месопотамия', effect: 'Положите жетон Змеи на зелёную карту соперника — Нисаба даёт вам научный символ этой карты.' },
  { id: 'astarte', name: 'Астарта', nameEn: 'Astarte', tag: 'Финикия', effect: 'Положите на карту 7 монет из банка: они не в казне (защищены от потерь), но тратятся как обычные. В конце игры 1 ПО за каждую оставшуюся.' },
  { id: 'baal', name: 'Баал', nameEn: 'Baal', tag: 'Финикия', effect: 'Заберите у соперника одну его коричневую или серую карту в свой город.' },
  { id: 'tanit', name: 'Танит', nameEn: 'Tanit', tag: 'Финикия', effect: 'Возьмите 12 монет.' },
  { id: 'aphrodite', name: 'Афродита', nameEn: 'Aphrodite', tag: 'Греция', points: 9, effect: '9 ПО.' },
  { id: 'hades', name: 'Аид', nameEn: 'Hades', tag: 'Греция', effect: 'Возьмите все карты из сброса, выберите одну и бесплатно постройте.' },
  { id: 'zeus', name: 'Зевс', nameEn: 'Zeus', tag: 'Греция', effect: 'Сбросьте одну карту из раскладки (любой стороной вверх) и заберите себе все жетоны с неё.' },
  { id: 'anubis', name: 'Анубис', nameEn: 'Anubis', tag: 'Египет', effect: 'Сбросьте карту из-под построенного Чуда (своего или соперника). Мгновенные эффекты не теряются, Чудо можно построить заново.' },
  { id: 'isis', name: 'Исида', nameEn: 'Isis', tag: 'Египет', effect: 'Возьмите карту из сброса и бесплатно постройте ею одно из своих Чудес.' },
  { id: 'ra', name: 'Ра', nameEn: 'Ra', tag: 'Египет', effect: 'Заберите у соперника одно его непостроенное Чудо.' },
  { id: 'mars', name: 'Марс', nameEn: 'Mars', tag: 'Рим', effect: '2 Щита.' },
  { id: 'minerva', name: 'Минерва', nameEn: 'Minerva', tag: 'Рим', effect: 'Поставьте фишку Минервы на любое деление трека. Маркер Конфликта, дойдя до неё, останавливается перед ней, затем фишку убирают.' },
  { id: 'neptune', name: 'Нептун', nameEn: 'Neptune', tag: 'Рим', effect: 'Сбросьте один Военный жетон без эффекта, затем примените эффект другого и тоже сбросьте.' },
]

const TEMPLES: RefItem[] = [
  { id: 'temple_mesopotamian', name: 'Месопотамский великий храм', nameEn: 'Mesopotamian Grand Temple', cost: 'ДДДСП', effect: 'Бесплатно при жетоне Мифологии Месопотамии.' },
  { id: 'temple_phoenician', name: 'Финикийский великий храм', nameEn: 'Phoenician Grand Temple', cost: 'ДКСПП', effect: 'Бесплатно при жетоне Мифологии Финикии.' },
  { id: 'temple_greek', name: 'Греческий великий храм', nameEn: 'Greek Grand Temple', cost: 'КККСП', effect: 'Бесплатно при жетоне Мифологии Греции.' },
  { id: 'temple_egyptian', name: 'Египетский великий храм', nameEn: 'Egyptian Grand Temple', cost: 'ГГГСП', effect: 'Бесплатно при жетоне Мифологии Египта.' },
  { id: 'temple_roman', name: 'Римский великий храм', nameEn: 'Roman Grand Temple', cost: 'ГКССП', effect: 'Бесплатно при жетоне Мифологии Рима.' },
]

const PANTHEON_PARTS: RefItem[] = [
  { id: 'gate', name: 'Врата', nameEn: 'Gate', effect: 'Кладутся в пустой слот Пантеона перед Эпохой II. Стоят вдвое дороже своего слота. Откройте верхнюю карту каждой из 5 стопок, бесплатно активируйте одну, остальные верните наверх стопок.' },
  { id: 'slots', name: 'Цены слотов Пантеона', effect: 'Под каждым слотом две цены: ваша и соперника. От ближнего к вам слота к дальнему: 3/8, 4/7, 5/6, 6/5, 7/4, 8/3 монет. Платите свою цену.' },
  { id: 'mythology', name: 'Жетоны Мифологии', nameEn: 'Mythology tokens', effect: 'Эпоха I, 5 в партии. Взяв карту с жетоном, возьмите 2 верхние карты богов этой Мифологии: одну лицом вниз в любой пустой слот Пантеона, другую — наверх стопки. Жетон остаётся у вас: бесплатная постройка Великого Храма того же символа, 2 ПО с «Мистицизмом».' },
  { id: 'offering', name: 'Жетоны Жертвоприношения', nameEn: 'Offering tokens', effect: 'Эпоха II, 3 в партии (−2, −3, −4). Одноразовая скидка на активацию карты Пантеона, сдачи нет. 2 ПО с «Мистицизмом», если жетон не использован.' },
  { id: 'snake', name: 'Жетон Змеи', nameEn: 'Snake token', effect: 'Используется способностью Нисабы.' },
  { id: 'minerva_pawn', name: 'Фишка Минервы', nameEn: 'Minerva pawn', effect: 'Используется способностью Минервы. Её можно поставить и в столицу.' },
]

const SENATORS: RefItem[] = [
  { id: 'politician_left', name: 'Политик — левая часть Сената', tag: '2 карты', effect: 'Действия в Палатах 1–2: добавить кубик Влияния или переместить свой кубик в соседнюю Палату. Число действий — по синим картам в городе: 0–1 → 1, 2–3 → 2, 4+ → 3.' },
  { id: 'politician_center', name: 'Политик — центральная часть', tag: '3 карты', effect: 'То же для Палат 3–4.' },
  { id: 'politician_right', name: 'Политик — правая часть', tag: '2 карты', effect: 'То же для Палат 5–6.' },
  { id: 'conspirator', name: 'Заговорщик', tag: '6 карт', effect: 'Одно из двух: положите 1 кубик в любую Палату или возьмите 2 Заговора, один оставьте лицом вниз, другой — наверх или под низ колоды.' },
]

const CONSPIRACIES: RefItem[] = [
  { id: 'extortion', name: 'Вымогательство', nameEn: 'Extortion', effect: 'Заберите у соперника одно непостроенное Чудо в свой город + переместите 1 свой кубик в соседнюю Палату.' },
  { id: 'blackmail', name: 'Шантаж', nameEn: 'Blackmail', effect: 'Заберите половину монет соперника (с округлением вверх).' },
  { id: 'expropriation', name: 'Экспроприация', nameEn: 'Expropriation', effect: 'Сбросьте одно синее здание соперника + переместите кубик.' },
  { id: 'swindle', name: 'Афера', nameEn: 'Swindle', effect: 'Сбросьте одно жёлтое здание соперника + переместите кубик.' },
  { id: 'obscurantism', name: 'Обскурантизм', nameEn: 'Obscurantism', effect: 'Выберите жетон Развития (с поля, у соперника или из коробки) и положите лицом вниз на эту карту — до конца игры им никто не пользуется.' },
  { id: 'coup', name: 'Переворот', nameEn: 'Coup', effect: '2 Щита.' },
  { id: 'property_fraud', name: 'Мошенничество с недвижимостью', nameEn: 'Property Fraud', effect: 'Возьмите здание из последнего ряда раскладки и бесплатно постройте (Сенаторов брать нельзя).' },
  { id: 'treason', name: 'Государственная измена', nameEn: 'Treason', effect: 'Втайне посмотрите карты, убранные при подготовке (Эпоха I — 3 карты Эпохи I; Эпоха II — 6 карт Эпох I–II; Эпоха III — 9 карт Эпох I–III), и бесплатно сыграйте одну.' },
  { id: 'political_maneuver', name: 'Политический манёвр', nameEn: 'Political Maneuver', effect: 'Положите 1 кубик Влияния, уберите 1 кубик соперника и переместите 1 кубик.' },
  { id: 'espionage', name: 'Шпионаж', nameEn: 'Espionage', effect: 'Втайне посмотрите жетоны Развития, убранные в начале игры, и сыграйте один.' },
  { id: 'turn_of_events', name: 'Поворот событий', nameEn: 'Turn of Events', effect: 'Сбросьте доступную карту раскладки, можно повторить ещё раз + переместите кубик. Жетоны с открывшихся карт берутся все.' },
  { id: 'embezzlement', name: 'Хищение', nameEn: 'Embezzlement', effect: 'Получите монет по числу своих кубиков в Сенате; соперник теряет монеты по числу своих кубиков.' },
  { id: 'foreclosure', name: 'Изъятие имущества', nameEn: 'Foreclosure', effect: 'Заберите у соперника одно коричневое или серое здание в свой город.' },
  { id: 'coercion', name: 'Принуждение', nameEn: 'Coercion', effect: 'Поменяйте своё синее или зелёное здание на здание того же цвета соперника + переместите кубик.' },
  { id: 'insider_influence', name: 'Внутреннее влияние', nameEn: 'Insider Influence', effect: 'Переместите один Декрет в другую Палату под уже лежащий там + переместите кубик.' },
  { id: 'sabotage', name: 'Саботаж', nameEn: 'Sabotage', effect: 'Верните в коробку одно построенное соперником Чудо. Мгновенные эффекты (монеты, жетоны, карты, доп. ход, Влияние) не теряются.' },
]

const DECREE_NOTE = 'У Декретов нет названий — только символ.'

const DECREES: RefItem[] = [
  { id: 'decree_ignore_cost_yellow', name: 'Скидка на жёлтые', effect: 'Игнорируйте 1 символ стоимости (ресурс или монеты) при постройке жёлтых зданий.' },
  { id: 'decree_ignore_cost_red', name: 'Скидка на красные', effect: 'Игнорируйте 1 символ стоимости при постройке красных зданий.' },
  { id: 'decree_ignore_cost_green', name: 'Скидка на зелёные', effect: 'Игнорируйте 1 символ стоимости при постройке зелёных зданий.' },
  { id: 'decree_wonder_discount', name: 'Скидка на Чудеса', effect: 'Платите на 1 ресурс (на выбор) меньше при постройке Чудес.' },
  { id: 'decree_income_blue', name: 'Доход с синих', effect: 'Когда вы или соперник строите синее здание, возьмите монеты по номеру текущей Эпохи (1/2/3).' },
  { id: 'decree_income_green', name: 'Доход с зелёных', effect: 'То же для зелёных зданий.' },
  { id: 'decree_income_yellow', name: 'Доход с жёлтых', effect: 'То же для жёлтых зданий.' },
  { id: 'decree_income_red', name: 'Доход с красных', effect: 'То же для красных зданий.' },
  { id: 'decree_income_wonder', name: 'Доход с Чудес', effect: 'То же, когда кто-либо строит Чудо.' },
  { id: 'decree_trade_brown', name: 'Дешёвые коричневые ресурсы', effect: '−1 монета за каждый покупаемый в банке коричневый ресурс (не ниже 1).' },
  { id: 'decree_trade_grey', name: 'Дешёвые серые ресурсы', effect: '−1 монета за каждый покупаемый в банке серый ресурс (не ниже 1).' },
  { id: 'decree_senate_plus2', name: '+2 синие для Сената', effect: 'При подсчёте действий в Сенате считайте на 2 синие карты больше.' },
  { id: 'decree_shield', name: 'Щит', effect: 'Получив контроль: 1 Щит, маркер на 1 к столице соперника. Потеряв контроль: маркер на 1 к вашей столице; если контроль перешёл к сопернику — на 2.' },
  { id: 'decree_discard_plus2', name: '+2 за сброс', effect: 'При сбросе карты за монеты берите на 2 монеты больше.' },
  { id: 'decree_opponent_chains', name: 'Чужие цепочки', effect: 'Можно пользоваться символами цепочек с карт соперника.' },
  { id: 'decree_conspirator_extra_turn', name: 'Ход после Заговорщика', effect: 'Наняв Заговорщика, сразу сыграйте ещё один ход.' },
].map((decree) => ({ ...decree, note: DECREE_NOTE }))

const MILITARY_BASE: RefItem[] = [
  { id: 'military_loot_2', name: 'Мародёрство «2»', nameEn: 'Looting', tag: '2 жетона', effect: 'Когда маркер Конфликта входит в зону, соперник теряет 2 монеты (если меньше — все). Жетон убирается.' },
  { id: 'military_loot_5', name: 'Мародёрство «5»', nameEn: 'Looting', tag: '2 жетона', effect: 'Соперник теряет 5 монет.' },
]

const MILITARY_AGORA: RefItem[] = [
  { id: 'agora_military_place', name: 'Жетон «+1 кубик»', tag: 'вместо «2»', effect: 'Положите 1 свой кубик Влияния в любую Палату.' },
  { id: 'agora_military_remove_move', name: 'Жетон «убрать + переместить»', tag: 'вместо «5»', effect: 'Уберите 1 кубик соперника из любой Палаты и переместите 1 свой кубик в соседнюю Палату.' },
]

export const REFERENCE_SECTIONS: RefSection[] = [
  { id: 'wonders', title: 'Чудеса света', expansion: 'base', items: WONDERS },
  { id: 'wonders-pantheon', title: 'Чудеса света «Пантеона»', expansion: 'pantheon', items: WONDERS_PANTHEON },
  { id: 'wonders-agora', title: 'Чудеса света «Агоры»', expansion: 'agora', intro: 'Эффект «при выборе» срабатывает только при выборе Чуда в подготовке.', items: WONDERS_AGORA },
  { id: 'progress', title: 'Жетоны Развития', expansion: 'base', items: PROGRESS },
  { id: 'progress-pantheon', title: 'Жетоны Развития «Пантеона»', expansion: 'pantheon', items: PROGRESS_PANTHEON },
  { id: 'progress-agora', title: 'Жетоны Развития «Агоры»', expansion: 'agora', items: PROGRESS_AGORA },
  { id: 'guilds', title: 'Гильдии', expansion: 'base', replacedBy: 'pantheon', intro: 'Монеты Гильдия даёт один раз при постройке; город для ПО можно выбрать другой.', items: GUILDS },
  { id: 'gods', title: 'Боги', expansion: 'pantheon', intro: 'По 3 бога в каждой из 5 Мифологий. Цена активации зависит от слота Пантеона.', items: GODS },
  { id: 'temples', title: 'Великие Храмы', expansion: 'pantheon', intro: 'Здания Эпохи III вместо Гильдий, в партии 3 из 5. Построено 1 / 2 / 3 Храма → 5 / 12 / 21 ПО.', items: TEMPLES },
  { id: 'pantheon-parts', title: 'Пантеон: Врата и жетоны', expansion: 'pantheon', items: PANTHEON_PARTS },
  { id: 'senators', title: 'Сенаторы', expansion: 'agora', intro: 'Цена найма = числу Сенаторов уже в вашем городе. Сенатора можно сбросить за монеты, как любую карту.', items: SENATORS },
  { id: 'conspiracies', title: 'Заговоры', expansion: 'agora', intro: 'Подготовка: подложите любую взятую карту раскладки под Заговор — ход закончен. Осуществление: в начале своего хода, не больше одного Заговора за ход.', items: CONSPIRACIES },
  { id: 'decrees', title: 'Декреты', expansion: 'agora', intro: 'Действуют, пока вы контролируете Палату. Ничья по кубикам — Декрет не действует ни для кого.', items: DECREES },
  { id: 'military', title: 'Военные жетоны', expansion: 'base', replacedBy: 'agora', items: MILITARY_BASE },
  { id: 'military-agora', title: 'Военные жетоны «Агоры»', expansion: 'agora', intro: 'Заменяют базовые жетоны. Эффект применяет активный игрок, когда маркер входит в зону.', items: MILITARY_AGORA },
]
