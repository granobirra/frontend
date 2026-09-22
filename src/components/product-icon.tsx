import { Lifebuoy, ShieldCheck, Waves } from "phosphor-react-native";

export function ProductIcon({
  type,
  size = 22,
  color,
}: {
  type: string;
  size?: number;
  color: string;
}) {
  if (type === "zattera") return <Lifebuoy size={size} color={color} weight="bold" />;
  if (type === "tuta") return <Waves size={size} color={color} weight="bold" />;
  return <ShieldCheck size={size} color={color} weight="bold" />;
}
