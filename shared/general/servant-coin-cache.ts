import { LRUCache } from "npm:lru-cache";

export class ServantConfigCache<K extends string | number, V extends object> {
  // Типизируем свойство `cache` как экземпляр LRUCache.
  private cache: LRUCache<K, V>;

  /**
   * Создает экземпляр ServantConfigCache.
   * @param {object} [options] - Опции для кэша.
   * @param {number} [options.stdTTL=0] - Стандартное время жизни (TTL) для элементов кэша в секундах.
   * Если 0, элементы не истекают по времени, если не задано явно при установке.
   * @param {number} [options.max=Infinity] - Максимальное количество элементов в кэше.
   */
  constructor(options: { stdTTL?: number; max?: number } = {}) {
    // Инстанцируем LRUCache напрямую, так как теперь мы импортируем сам класс.
    this.cache = new LRUCache<K, V>({
      max: options.max ?? Infinity, // Максимальное количество элементов
      ttl: (options.stdTTL ?? 0) * 1000, // TTL в миллисекундах (0 означает без истечения)
      allowStale: false, // Не возвращать устаревшие элементы
      updateAgeOnGet: false, // Не обновлять время жизни при получении
      updateAgeOnHas: false, // Не обновлять время жизни при проверке наличия
    });
  }

  /**
   * Устанавливает значение в кэш.
   * @param {K} key - Ключ элемента.
   * @param {V} value - Значение элемента.
   * @param {number} [ttl] - Время жизни для этого конкретного элемента в секундах.
   * Если не указано, используется stdTTL, заданный при инициализации.
   * Если 0, элемент не истекает.
   */
  set(key: K, value: V, ttl?: number): void {
    // Если ttl предоставлен, используем его для переопределения стандартного TTL.
    // lru-cache принимает ttl в миллисекундах.
    if (ttl !== undefined) {
      this.cache.set(key, value, { ttl: ttl * 1000 });
    } else {
      // Иначе используем стандартный TTL, заданный в конструкторе.
      this.cache.set(key, value);
    }
  }

  /**
   * Получает значение из кэша.
   * @param {K} key - Ключ элемента.
   * @returns {V | undefined} - Значение элемента или undefined, если элемент не найден или истек.
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Проверяет наличие элемента в кэше.
   * @param {K} key - Ключ элемента.
   * @returns {boolean} - true, если элемент существует и не истек, иначе false.
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Удаляет элемент из кэша.
   * @param {K} key - Ключ элемента.
   * @returns {boolean} - true, если элемент был удален, иначе false.
   */
  del(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Очищает весь кэш.
   */
  flushAll(): void {
    this.cache.clear();
  }

  /**
   * Возвращает количество элементов в кэше.
   * @returns {number} - Количество элементов.
   */
  size(): number {
    return this.cache.size;
  }
}
