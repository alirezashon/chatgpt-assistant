import type { ActionExecutionStep, ProductAction } from '@/features/actions';
import type { HomeAction } from '@/popup/home/home-types';

import type { AppLocale } from './app-locale';

interface ActionCopy {
  readonly artifacts?: readonly string[];
  readonly description: string;
  readonly steps?: Readonly<Record<string, StepCopy>>;
  readonly title: string;
}

interface StepCopy {
  readonly description: string;
  readonly label: string;
}

const FA_ACTION_COPY: Readonly<Record<string, ActionCopy>> = {
  'article.translate': {
    artifacts: ['مقاله ترجمه‌شده'],
    description: 'مقاله فعلی یا بخش انتخاب‌شده را ترجمه کن.',
    title: 'ترجمه مقاله',
  },
  'chat.extractTasks': {
    artifacts: ['لیست کارها', 'برنامه اجرا'],
    description: 'گفت‌وگوی فعال ChatGPT را به کارهای روشن، ریسک‌ها و پیگیری‌های بعدی تبدیل کن.',
    title: 'استخراج کارها',
  },
  'chat.summarizeThread': {
    artifacts: ['خلاصه گفت‌وگو', 'تصمیم‌ها و قدم‌های بعدی'],
    description: 'گفت‌وگوی فعال ChatGPT را به تصمیم‌ها، پرسش‌های باز و قدم‌های بعدی خلاصه کن.',
    title: 'خلاصه چت',
  },
  'code.buildRegex': {
    artifacts: ['توضیح Regex'],
    description: 'از هدف ساده یا نمونه‌های انتخاب‌شده یک Regex بساز.',
    title: 'ساخت Regex',
  },
  'code.findBug': {
    artifacts: ['توضیح خطا', 'چک‌لیست عیب‌یابی'],
    description: 'باگ‌ها، حالت‌های مرزی و علت‌های احتمالی را در زمینه فعلی کد پیدا کن.',
    title: 'توضیح باگ',
  },
  'code.generateTests': {
    artifacts: ['برنامه تست', 'چک‌لیست پوشش'],
    description: 'برای کد یا Pull Request فعلی یک برنامه تست متمرکز بساز.',
    title: 'تولید تست',
  },
  'code.writeSql': {
    artifacts: ['کوئری SQL'],
    description: 'از یک سوال ساده یا Schema انتخاب‌شده، SQL بنویس.',
    title: 'نوشتن SQL',
  },
  'content.generateDocumentation': {
    artifacts: ['مستندات تولیدشده'],
    description: 'از کد، مخزن یا زمینه محصول فعلی مستندات تولید کن.',
    title: 'تولید مستندات',
  },
  'data.extractStructured': {
    artifacts: ['داده استخراج‌شده'],
    description: 'واقعیت‌ها، موجودیت‌ها یا جدول‌ها را به داده ساختاریافته تبدیل کن.',
    title: 'استخراج داده ساختاریافته',
  },
  'email.improveDraft': {
    artifacts: ['پیش‌نویس بهبود‌یافته'],
    description: 'پیش‌نویس فعال را از نظر شفافیت، لحن و کوتاهی بهتر کن.',
    title: 'بهبود پیش‌نویس',
  },
  'email.reply': {
    artifacts: ['پیش‌نویس پاسخ ایمیل'],
    description: 'با استفاده از رشته ایمیل فعلی و لحن مناسب، پاسخ پیش‌نویس کن.',
    title: 'پاسخ به ایمیل',
  },
  'email.summarizeThread': {
    artifacts: ['خلاصه رشته ایمیل', 'اقدام‌ها'],
    description: 'رشته ایمیل فعلی و اقدام‌های لازم را خلاصه کن.',
    title: 'خلاصه رشته ایمیل',
  },
  'email.translate': {
    artifacts: ['متن ترجمه‌شده'],
    description: 'متن انتخاب‌شده یا قابل مشاهده ایمیل را ترجمه کن.',
    title: 'ترجمه ایمیل',
  },
  'github.generateCommit': {
    artifacts: ['پیام Commit'],
    description: 'از تغییرات قابل مشاهده مخزن، یک پیام Commit شفاف بنویس.',
    title: 'تولید پیام Commit',
  },
  'github.reviewPr': {
    artifacts: ['یادداشت‌های Review', 'ریسک‌ها و تست‌های ناقص'],
    description: 'یک Pull Request را از نظر ریسک، Regression و تست‌های ناقص بررسی کن.',
    title: 'بررسی PR',
  },
  'github.summarizeRepo': {
    artifacts: ['خلاصه مخزن'],
    description: 'هدف، ساختار و فایل‌های مهم مخزن را خلاصه کن.',
    title: 'خلاصه مخزن',
  },
  'image.edit': {
    artifacts: ['تصویر ویرایش‌شده', 'دستورالعمل ادیت'],
    description:
      'عکس را آپلود یا از صفحه بخوان، برش بده، فیلتر کن، دانلود کن یا به input چت اتچ کن.',
    title: 'ادیت تصویر',
  },
  'language.normalizePersian': {
    artifacts: ['متن نرمال‌شده', 'تبدیل‌های زبان'],
    description:
      'عددهای فارسی و انگلیسی را تبدیل کن، کاراکترهای عربی را فارسی کن و متن تایپ‌شده با کیبورد اشتباه را اصلاح کن.',
    title: 'ابزار متن فارسی',
  },
  'language.speechToText': {
    artifacts: ['متن پیاده‌شده', 'متن تمیزشده'],
    description: 'گفتار فارسی یا انگلیسی را با تشخیص صدای مرورگر به متن قابل ویرایش تبدیل کن.',
    title: 'صوت به متن',
  },
  'language.textToSpeech': {
    artifacts: ['پخش صوتی', 'متن منبع'],
    description: 'متن فارسی یا انگلیسی را با بهترین صدای موجود در مرورگر بخوان.',
    title: 'متن به صوت',
  },
  'meeting.createNotes': {
    artifacts: ['یادداشت جلسه', 'اقدام‌ها'],
    description: 'از Transcript، سند یا متن انتخاب‌شده یادداشت جلسه بساز.',
    title: 'ساخت یادداشت جلسه',
  },
  'memory.saveContext': {
    artifacts: ['زمینه ذخیره‌شده'],
    description: 'زمینه مفید را برای جریان‌های کاری بعدی ذخیره کن.',
    title: 'ذخیره در حافظه',
  },
  'page.summarize': {
    artifacts: ['خلاصه صفحه', 'اقدام‌های بعدی'],
    description: 'نکته‌های کلیدی، تصمیم‌ها و اقدام‌های بعدی صفحه فعلی را استخراج کن.',
    title: 'خلاصه صفحه',
  },
  'prompt.improve': {
    artifacts: ['پرامپت بهبود‌یافته', 'چک‌لیست پرامپت'],
    description:
      'چت خالی، متن انتخاب‌شده یا پیش‌نویس خام را به یک پرامپت دقیق با زمینه و معیار موفقیت تبدیل کن.',
    title: 'بهبود پرامپت',
  },
  'research.topic': {
    artifacts: ['گزارش پژوهش', 'مقایسه منابع'],
    description: 'این موضوع را در منابع معتبر بررسی کن و یافته‌های کوتاه بده.',
    title: 'پژوهش موضوع',
  },
  'selection.explain': {
    artifacts: ['توضیح کد'],
    description: 'کد، Log، خطا یا Stack Trace انتخاب‌شده را توضیح بده.',
    title: 'توضیح کد یا خطا',
  },
  'video.cut': {
    artifacts: ['کلیپ ویدیو', 'دستورالعمل برش'],
    description:
      'ویدیو را آپلود یا از صفحه بخوان، بازه شروع و پایان را انتخاب کن و کلیپ خروجی بگیر.',
    title: 'برش ویدیو',
  },
  'workflow.start': {
    artifacts: ['برنامه گردش‌کار'],
    description: 'از این زمینه یک گردش‌کار چندمرحله‌ای و قابل تکرار شروع کن.',
    title: 'اجرای گردش‌کار',
  },
  'youtube.chapters': {
    artifacts: ['فصل‌های ویدیو'],
    description: 'از ویدیوی فعلی فصل‌ها و Timestampها را استخراج کن.',
    title: 'استخراج فصل‌ها',
  },
  'youtube.notes': {
    artifacts: ['یادداشت آموزشی'],
    description: 'ویدیوی فعلی را به یادداشت‌های ساختاریافته تبدیل کن.',
    title: 'تولید یادداشت',
  },
  'youtube.summarize': {
    artifacts: ['خلاصه ویدیو', 'نکته‌های کلیدی'],
    description: 'ویدیوی فعلی را خلاصه کن و نکته‌های مهمش را بیرون بکش.',
    title: 'خلاصه ویدیو',
  },
};

const FA_STEP_COPY: Readonly<Record<string, StepCopy>> = {
  'assess-risk': {
    description: 'ریسک‌های درستی، امنیت و پوشش تست را مشخص کن.',
    label: 'سنجش ریسک',
  },
  'capture-context': {
    description: 'عنوان، URL، متن انتخاب‌شده و خلاصه را جمع‌آوری کن.',
    label: 'ثبت زمینه',
  },
  classify: {
    description: 'کد، Log، Stack Trace یا متن عادی را تشخیص بده.',
    label: 'دسته‌بندی محتوا',
  },
  'compare-sources': {
    description: 'منابع معتبر را گردآوری و مقایسه کن.',
    label: 'مقایسه منابع',
  },
  'capture-transcript': {
    description: 'نتیجه‌های موقت و نهایی تشخیص صدا را جمع‌آوری کن.',
    label: 'ثبت متن گفتار',
  },
  'clean-language-text': {
    description: 'عددها و کاراکترهای فارسی را برای استفاده دوباره تمیز کن.',
    label: 'تمیزسازی متن',
  },
  'convert-digits': {
    description: 'عددهای فارسی و انگلیسی را در هر دو جهت تبدیل کن.',
    label: 'تبدیل عددها',
  },
  'draft-message': {
    description: 'یک پیام Commit کوتاه و شفاف بنویس.',
    label: 'نوشتن پیام',
  },
  'draft-reply': {
    description: 'یک پاسخ کوتاه با لحن درست بنویس.',
    label: 'نوشتن پاسخ',
  },
  'extract-actions': {
    description: 'تصمیم‌ها، درخواست‌ها و موعدها را پیدا کن.',
    label: 'استخراج اقدام‌ها',
  },
  'extract-decisions': {
    description: 'تصمیم‌ها، پرسش‌های باز و زمینه‌های قابل استفاده را پیدا کن.',
    label: 'استخراج تصمیم‌ها',
  },
  'extract-tasks': {
    description: 'گفت‌وگو را به قدم‌های عملی و قابل پیگیری تبدیل کن.',
    label: 'استخراج کارها',
  },
  'identify-signals': {
    description: 'تصمیم‌ها، واقعیت‌ها، ادعاها و پرسش‌های باز را پیدا کن.',
    label: 'شناسایی نشانه‌ها',
  },
  'edit-canvas': {
    description: 'تصویر را با Canvas برش بده، بچرخان و فیلتر کن.',
    label: 'ادیت با Canvas',
  },
  'export-media': {
    description: 'خروجی را برای دانلود یا اتچ به صفحه فعال آماده کن.',
    label: 'خروجی رسانه',
  },
  'load-media': {
    description: 'فایل را آپلود کن یا سورس‌های رسانه‌ای صفحه فعلی را بخوان.',
    label: 'خواندن رسانه',
  },
  'load-language-text': {
    description: 'متن انتخاب‌شده، چسبانده‌شده یا تایپ‌شده را دریافت کن.',
    label: 'خواندن متن',
  },
  'normalize-persian': {
    description: 'ی/ک عربی و متن تایپ‌شده با چیدمان اشتباه را اصلاح کن.',
    label: 'نرمال‌سازی فارسی',
  },
  'prioritize-work': {
    description: 'کارها را بر اساس فوریت و وابستگی گروه‌بندی کن.',
    label: 'اولویت‌بندی کار',
  },
  'read-chat': {
    description: 'پیام‌های قابل مشاهده کاربر و دستیار را دریافت کن.',
    label: 'خواندن چت',
  },
  'read-intent': {
    description: 'هدف، متن انتخاب‌شده یا پیش‌نویس خام را دریافت کن.',
    label: 'خواندن هدف',
  },
  'read-page': {
    description: 'عنوان، ساختار و محتوای اصلی صفحه را دریافت کن.',
    label: 'خواندن صفحه',
  },
  'read-thread': {
    description: 'رشته ایمیل و زمینه گیرنده را بخوان.',
    label: 'خواندن رشته',
  },
  'return-table': {
    description: 'یک جدول قابل خروجی گرفتن ضمیمه کن.',
    label: 'برگرداندن جدول',
  },
  'return-prompt': {
    description: 'یک پرامپت آماده ارسال و چک‌لیست کوتاه تولید کن.',
    label: 'تحویل پرامپت',
  },
  'save-memory': {
    description: 'زمینه را برای استفاده‌های بعدی ذخیره کن.',
    label: 'ذخیره حافظه',
  },
  'select-range': {
    description: 'زمان شروع و پایان کلیپ را مشخص کن.',
    label: 'انتخاب بازه',
  },
  'select-voice': {
    description: 'برای فارسی صدای fa-IR را ترجیح بده و در صورت نبود، fallback امن انتخاب کن.',
    label: 'انتخاب صدا',
  },
  'speak-text': {
    description: 'متن را داخل استودیو زبان پخش، متوقف یا دوباره اجرا کن.',
    label: 'خواندن متن',
  },
  'start-dictation': {
    description: 'تشخیص صدای میکروفون را با اولویت پشتیبانی fa-IR شروع کن.',
    label: 'شروع دیکته',
  },
  'structure-prompt': {
    description: 'نقش، زمینه، محدودیت‌ها، قالب خروجی و نمونه‌ها را اضافه کن.',
    label: 'ساختاردهی پرامپت',
  },
  'write-brief': {
    description: 'یافته‌ها را همراه با محدودیت‌ها و قدم‌های بعدی بنویس.',
    label: 'نوشتن گزارش',
  },
  'write-summary': {
    description: 'یک خلاصه کوتاه و جواب‌محور تولید کن.',
    label: 'نوشتن خلاصه',
  },
};

export function localizeProductAction(action: ProductAction, locale: AppLocale): ProductAction {
  if (locale === 'en') {
    return action;
  }

  const copy = FA_ACTION_COPY[action.id];

  if (copy === undefined) {
    return action;
  }

  return {
    ...action,
    artifactsProduced: action.artifactsProduced.map((artifact, index) => ({
      ...artifact,
      title: copy.artifacts?.[index] ?? artifact.title,
    })),
    description: copy.description,
    executionPlan: localizeExecutionPlan(action.executionPlan, copy),
    suggestedFollowUps: action.suggestedFollowUps.map((followUp) => ({
      ...followUp,
      title: localizeActionTitle(followUp.actionId, followUp.title, locale),
    })),
    title: copy.title,
  };
}

export function localizeHomeAction(action: HomeAction, locale: AppLocale): HomeAction {
  if (locale === 'en') {
    return action;
  }

  const copy = FA_ACTION_COPY[action.id];

  if (copy === undefined) {
    return action;
  }

  const localized: HomeAction = {
    ...action,
    description: copy.description,
    title: copy.title,
  };

  return {
    ...localized,
    ...(action.artifactsProduced === undefined
      ? {}
      : {
          artifactsProduced: action.artifactsProduced.map((artifact, index) => ({
            ...artifact,
            title: copy.artifacts?.[index] ?? artifact.title,
          })),
        }),
    ...(action.executionPlan === undefined
      ? {}
      : { executionPlan: localizeExecutionPlan(action.executionPlan, copy) }),
    ...(action.suggestedFollowUps === undefined
      ? {}
      : {
          suggestedFollowUps: action.suggestedFollowUps.map((followUp) => ({
            ...followUp,
            title: localizeActionTitle(followUp.actionId, followUp.title, locale),
          })),
        }),
  };
}

export function localizeActionTitle(actionId: string, fallback: string, locale: AppLocale): string {
  if (locale === 'en') {
    return fallback;
  }

  return FA_ACTION_COPY[actionId]?.title ?? fallback;
}

function localizeExecutionPlan(
  executionPlan: readonly ActionExecutionStep[],
  copy: ActionCopy,
): readonly ActionExecutionStep[] {
  return executionPlan.map((step) => {
    const stepCopy = copy.steps?.[step.id] ?? FA_STEP_COPY[step.id];

    if (stepCopy === undefined) {
      return step;
    }

    return {
      ...step,
      description: stepCopy.description,
      label: stepCopy.label,
    };
  });
}
