export type UserRole = "admin" | "customer";
export type OrderStatus = "pending" | "process" | "shipped" | "done" | "cancel";

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  img: string;
  desc: string;
};

export type CartItem = MenuItem & { qty: number };
export type User = {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};
export type Order = {
  id: string;
  userEmail: string;
  userName: string;
  phone: string;
  address: string;
  city: string;
  payment: string;
  items: CartItem[];
  subtotal: number;
  ongkir: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
};
export type SiteTextField = {
  key: string;
  group: string;
  label: string;
  default: string;
  multiline?: boolean;
};
export type Notification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  time: string;
};
export type SiteTexts = Record<string, string>;

export type AppStore = {
  ready: boolean;
  menu: MenuItem[];
  cart: CartItem[];
  users: User[];
  orders: Order[];
  currentUser: User | null;
  siteTexts: SiteTexts;
  notifications: Notification[];
  setMenu: (menu: MenuItem[]) => void;
  setCart: (cart: CartItem[]) => void;
  setUsers: (users: User[]) => void;
  setOrders: (orders: Order[]) => void;
  setCurrentUser: (user: User | null) => void;
  setSiteTexts: (texts: SiteTexts) => void;
  setNotifications: (items: Notification[]) => void;
};
