import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import cn from './locales/cn.json'

export type Locale = 'en' | 'ru' | 'cn'

export default createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'en',
  messages: { en, ru, cn },
})
