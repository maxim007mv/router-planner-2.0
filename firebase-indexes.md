# Настройка индексов Firebase для фильтров ресторанов

Для корректной работы фильтров ресторанов необходимо создать следующие составные индексы в Firebase Firestore:

## Индексы для дешевых ресторанов
Коллекция: `places`
Поля:
- `type` (Ascending)
- `priceLevel` (Ascending)
- `rating` (Descending)

## Индексы для дорогих ресторанов
Коллекция: `places`
Поля:
- `type` (Ascending)
- `priceLevel` (Ascending)
- `rating` (Descending)

## Индексы для топовых ресторанов месяца
Коллекция: `places`
Поля:
- `type` (Ascending)
- `createdAt` (Ascending)
- `createdAt` (Descending)
- `rating` (Descending)

## Как создать индексы

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. В меню слева выберите "Firestore Database"
4. Перейдите на вкладку "Indexes"
5. Нажмите "Create Index"
6. Заполните поля согласно указанным выше настройкам
7. Нажмите "Create"

Примечание: Индексы создаются не мгновенно, процесс может занять несколько минут. 