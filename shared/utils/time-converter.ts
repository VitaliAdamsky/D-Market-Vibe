// time-utils.ts

// Используем esm.sh, так как он лучше справляется с разрешением вложенных файлов
// в пакетах, чем спецификатор npm: в Deno для некоторых пакетов, как dayjs.
import dayjs from "https://esm.sh/dayjs";
// Импорт для побочного эффекта (регистрации локали). Этот синтаксис корректен.
import "https://esm.sh/dayjs/locale/ru";

// Устанавливаем русский язык по умолчанию для всех вызовов dayjs
dayjs.locale("ru");

/**
 * Преобразует Unix-время в ISO-формат (UTC)
 * @param unixTimestamp - Время в миллисекундах
 * @returns ISO-строка (UTC)
 */
export function UnixToISO(unixTimestamp: number): string {
  return dayjs(unixTimestamp).toISOString();
}

/**
 * Преобразует Unix-время в формат "YYYY-MM-DD HH:mm:ss"
 * @param unixTimestamp - Время в миллисекундах
 * @returns Форматированное время
 */
export function UnixToTime(unixTimestamp: number): string {
  return dayjs(unixTimestamp).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Преобразует Unix-время в русский формат с названиями дней и месяцев
 * @param unixTimestamp - Время в миллисекундах
 * @returns Пример: "пт, 1 янв 2024 00:00:00"
 */
export function UnixToNamedTimeRu(unixTimestamp: number): string {
  // Исправлена опечатка в формате года (был странный символ, теперь YYYY)
  return dayjs(unixTimestamp).format("ddd, D MMM YYYY HH:mm:ss");
}
