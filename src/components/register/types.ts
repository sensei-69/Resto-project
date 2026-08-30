export type Role = "consumer" | "courier";

export type VehicleType = "bike" | "scooter" | "car" | "walk";

export type RegisterData = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  vehicleType: VehicleType | "";
  fromHour: string;
  toHour: string;
  days: string[];
};

export const emptyData: RegisterData = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  email: "",
  password: "",
  confirmPassword: "",
  cardName: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
  vehicleType: "",
  fromHour: "09:00",
  toHour: "18:00",
  days: [],
};

export type StepProps = {
  data: RegisterData;
  set: <K extends keyof RegisterData>(key: K, value: RegisterData[K]) => void;
  next: () => void;
  back: () => void;
};
