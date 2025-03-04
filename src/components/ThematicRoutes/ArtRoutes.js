import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPalette, FaMapMarkerAlt, FaClock, FaSubway, 
  FaInfoCircle, FaCamera, FaWalking, FaCoffee,
  FaDirections, FaMapMarkedAlt
} from 'react-icons/fa';
import './ArtRoutes.css';

const artRoutes = {
  1: {
    title: "Центр города — от «Гаража» до Патриков",
    description: "Классический маршрут по главным точкам современного искусства в центре",
    transport: "Начало у метро «Парк Культуры» (Кольцевая линия)",
    duration: "4 часа",
    pace: "moderate",
    timeOfDay: "afternoon",
    points: [
      {
        id: 1,
        name: "Музей современного искусства «Гараж»",
        address: "Парк Горького, Крымский Вал, 9",
        description: "Ведущая площадка современного искусства в России",
        activities: [
          "Выставки мировых художников",
          "Архив российского искусства",
          "Посещение книжного магазина"
        ],
        tips: [
          "Загляните в книжный магазин и кафе на территории"
        ],
        duration: "1,5 часа",
        transition: "Пешая прогулка через Парк Горького",
        coordinates: [55.731815, 37.603691]
      },
      {
        id: 2,
        name: "Уличные объекты в Парке Горького",
        description: "Коллекция современных арт-объектов под открытым небом",
        activities: [
          "Арт-инсталляции у главного входа",
          "«Дерево любви» у набережной",
          "Прогулка по набережной"
        ],
        tips: [
          "Летом можно арендовать велосипед для перемещения"
        ],
        duration: "40 минут",
        transition: "15 минут на такси до следующей точки",
        coordinates: [55.729380, 37.601111]
      },
      {
        id: 3,
        name: "Галерея «Электрозавод»",
        address: "ул. Электрозаводская, 21",
        description: "Экспериментальное выставочное пространство",
        activities: [
          "Экспериментальные проекты",
          "Интерактивные выставки",
          "Мастер-классы"
        ],
        duration: "1 час",
        transition: "20 минут на метро до Патриарших прудов",
        coordinates: [55.781898, 37.704540]
      },
      {
        id: 4,
        name: "Стрит-арт на Патриарших прудах",
        address: "Малый Козихинский переулок, Бол. Козихинский пер.",
        description: "Современное уличное искусство в историческом районе",
        activities: [
          "Граффити во дворах",
          "Работы Тимофея Ради",
          "Прогулка по району"
        ],
        tips: [
          "Загляните в кафе «Март» на Патриарших для отдыха"
        ],
        duration: "45 минут",
        coordinates: [55.764794, 37.592454]
      }
    ]
  },
  2: {
    title: "Арт-кластеры — «Винзавод» и «Хохловка»",
    description: "Промышленные зоны, превращенные в арт-пространства",
    transport: "м. «Курская», далее пешком до «Винзавода» (4-й Сыромятнический пер., 1)",
    duration: "3.5 часа",
    pace: "moderate",
    timeOfDay: "afternoon",
    points: [
      {
        id: 1,
        name: "ЦСИ «Винзавод»",
        address: "4-й Сыромятнический пер., 1",
        description: "Крупнейший центр современного искусства в России",
        activities: [
          "Посещение галереи «Третий этаж»",
          "Выставки «Frida Project Foundation»",
          "Осмотр временных экспозиций"
        ],
        tips: [
          "Проверьте расписание лекций и воркшопов"
        ],
        duration: "1,5 часа",
        transition: "10 минут на такси до Арт-центра «Арма»",
        coordinates: [55.754167, 37.661667]
      },
      {
        id: 2,
        name: "Арт-центр «Арма» (Хохловка)",
        address: "ул. Верхняя Радищевская",
        description: "Креативный кластер в историческом промышленном здании",
        activities: [
          "Осмотр муралов",
          "Изучение граффити-зон",
          "Фотографирование индустриальных инсталляций"
        ],
        duration: "1 час",
        transition: "15 минут пешком до Art Play",
        coordinates: [55.747778, 37.648889]
      },
      {
        id: 3,
        name: "Парк Art Play",
        address: "Нижняя Сыромятническая ул., 10",
        description: "Дизайн-завод с выставочными пространствами",
        activities: [
          "Сезонные выставки",
          "Посещение мастерских художников",
          "Отдых в ресторане с видом на арт-объекты"
        ],
        tips: [
          "Рекомендуем посетить ресторан «Винзавод. Линия»"
        ],
        duration: "1 час",
        coordinates: [55.752778, 37.660833]
      }
    ]
  },
  3: {
    title: "Красный Октябрь и Болотная набережная",
    description: "Современное искусство в историческом центре Москвы",
    transport: "м. «Кропоткинская», пешком к Болотной набережной",
    duration: "4 часа",
    pace: "relaxed",
    timeOfDay: "afternoon",
    points: [
      {
        id: 1,
        name: "Галерея «Red October»",
        address: "Берсеневская наб., 6",
        description: "Современная галерея в историческом здании",
        activities: [
          "Выставки молодых художников",
          "VR-инсталляции",
          "Интерактивные экспозиции"
        ],
        duration: "1,5 часа",
        transition: "5 минут пешком до набережной",
        coordinates: [55.744722, 37.609722]
      },
      {
        id: 2,
        name: "Стрит-арт на Берсеневской набережной",
        description: "Уличное искусство в центре города",
        activities: [
          "Осмотр граффити «Москва — не город»",
          "Фотосессия у работ Покраса Лампаса",
          "Прогулка по набережной"
        ],
        duration: "30 минут",
        transition: "15 минут на метро до «Дмитровской»",
        coordinates: [55.744444, 37.608889]
      },
      {
        id: 3,
        name: "Art Basement на «Флаконе»",
        address: "ул. Б. Новодмитровская, 36",
        description: "Подземная галерея современного искусства",
        activities: [
          "Подземные выставки",
          "Поп-ап маркеты",
          "Отдых в коворкинге «Кафемир»"
        ],
        tips: [
          "Обязательно попробуйте кофе и десерты в «Кафемир»"
        ],
        duration: "2 часа",
        coordinates: [55.800278, 37.591389]
      }
    ]
  },
  4: {
    title: "ВДНХ и Ботанический сад",
    description: "Искусство в окружении природы и архитектуры",
    transport: "м. «ВДНХ»",
    duration: "4.5 часа",
    pace: "relaxed",
    timeOfDay: "morning",
    points: [
      {
        id: 1,
        name: "Павильон «Космос» (ВДНХ)",
        description: "Интерактивный музей космонавтики",
        activities: [
          "Осмотр арт-инсталляций на тему технологий",
          "Изучение космической техники",
          "Интерактивные экспонаты"
        ],
        duration: "1,5 часа",
        transition: "10 минут пешком до парка",
        coordinates: [55.822778, 37.639722]
      },
      {
        id: 2,
        name: "Парк «Останкино»",
        description: "Исторический парк с современными арт-объектами",
        activities: [
          "Фотографирование скульптуры «Дерево жизни»",
          "Осмотр инсталляции «Цветочный шар»",
          "Прогулка по парку"
        ],
        duration: "1 час",
        transition: "15 минут пешком до Ботанического сада",
        coordinates: [55.829444, 37.611944]
      },
      {
        id: 3,
        name: "Галерея «Ботаника»",
        address: "Ботанический сад МГУ",
        description: "Выставочное пространство в природном окружении",
        activities: [
          "Экологическое искусство",
          "Выставки под открытым небом",
          "Пикник в парке"
        ],
        tips: [
          "Возьмите пикник для отдыха в парке"
        ],
        duration: "2 часа",
        coordinates: [55.845000, 37.538889]
      }
    ]
  },
  5: {
    title: "Новая Москва — Сити и Сколково",
    description: "Современное искусство в деловых районах столицы",
    transport: "м. «Деловой центр»",
    duration: "4 часа",
    pace: "active",
    timeOfDay: "afternoon",
    points: [
      {
        id: 1,
        name: "Башни Москва-Сити",
        description: "Современное искусство в деловом квартале",
        activities: [
          "Осмотр арт-объектов в зоне «Афимолл»",
          "Инсталляция «Вращающиеся сферы»",
          "Панорамные виды города"
        ],
        duration: "1 час",
        transition: "25 минут на такси до Сколково",
        coordinates: [55.749722, 37.537778]
      },
      {
        id: 2,
        name: "Галерея «Сколково»",
        address: "Инновационный центр",
        description: "Современное искусство в технопарке",
        activities: [
          "Выставки на стыке науки и искусства",
          "Интерактивные инсталляции",
          "Технологичные арт-объекты"
        ],
        duration: "2 часа",
        transition: "15 минут пешком до Технопарка",
        coordinates: [55.686944, 37.348889]
      },
      {
        id: 3,
        name: "Стрит-арт в районе «Технопарк»",
        description: "Уличное искусство в инновационном квартале",
        activities: [
          "Осмотр муралов от международных художников",
          "Фотосессия у граффити",
          "Отдых в ресторане «Барвиха Lounge»"
        ],
        tips: [
          "Посетите ресторан «Барвиха Lounge» с панорамным видом"
        ],
        duration: "1 час",
        coordinates: [55.695000, 37.354444]
      }
    ]
  }
};

const ArtRoutes = () => {
  const [selectedRoute, setSelectedRoute] = useState(1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const route = artRoutes[selectedRoute];

  return (
    <motion.div 
      className="art-routes-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="route-selector">
        {Object.keys(artRoutes).map((routeId) => (
          <button
            key={routeId}
            className={`route-selector-btn ${selectedRoute === parseInt(routeId) ? 'active' : ''}`}
            onClick={() => setSelectedRoute(parseInt(routeId))}
          >
            {artRoutes[routeId].title}
          </button>
        ))}
      </div>

      <motion.div 
        className="art-route-card"
        variants={itemVariants}
        key={selectedRoute}
        initial="hidden"
        animate="visible"
      >
        <div className="route-header">
          <FaPalette className="route-icon" />
          <h2>{route.title}</h2>
          <p className="route-description">{route.description}</p>
        </div>

        <motion.div className="route-info" variants={itemVariants}>
          <div className="info-item">
            <FaClock className="info-icon" />
            <span>Длительность: {route.duration}</span>
          </div>
          <div className="info-item">
            <FaWalking className="info-icon" />
            <span>Темп: {
              route.pace === 'relaxed' ? 'Расслабленный' :
              route.pace === 'moderate' ? 'Умеренный' : 'Активный'
            }</span>
          </div>
          <div className="info-item">
            <FaClock className="info-icon" />
            <span>Время: {
              route.timeOfDay === 'morning' ? 'Утро' :
              route.timeOfDay === 'afternoon' ? 'День' : 'Вечер'
            }</span>
          </div>
        </motion.div>

        <motion.div 
          className="transport-info"
          variants={itemVariants}
        >
          <FaSubway className="info-icon" />
          <span>{route.transport}</span>
        </motion.div>

        <div className="route-points">
          {route.points.map((point, index) => (
            <motion.div 
              key={index}
              className="route-point"
              variants={itemVariants}
            >
              <div className="point-header">
                <h3>
                  <FaMapMarkerAlt className="point-icon" />
                  {point.name}
                </h3>
                <span className="duration">
                  <FaClock className="time-icon" />
                  {point.duration}
                </span>
              </div>

              {point.description && (
                <motion.div 
                  className="point-description"
                  variants={itemVariants}
                >
                  <p>{point.description}</p>
                </motion.div>
              )}

              {point.address && (
                <motion.div 
                  className="point-address"
                  variants={itemVariants}
                >
                  <FaMapMarkerAlt className="info-icon" />
                  {point.address}
                </motion.div>
              )}

              {point.activities && point.activities.length > 0 && (
                <motion.div 
                  className="point-activities"
                  variants={itemVariants}
                >
                  <h4>🎯 Активности:</h4>
                  {point.activities.map((activity, i) => (
                    <div key={i} className="activity-item">
                      <FaCamera className="info-icon" />
                      {activity}
                    </div>
                  ))}
                </motion.div>
              )}

              {point.tips && point.tips.length > 0 && (
                <motion.div 
                  className="point-tips"
                  variants={itemVariants}
                >
                  <h4>💡 Советы:</h4>
                  {point.tips.map((tip, i) => (
                    <div key={i} className="tip-item">
                      <FaInfoCircle className="info-icon" />
                      {tip}
                    </div>
                  ))}
                </motion.div>
              )}

              {point.transition && (
                <motion.div 
                  className="point-transition"
                  variants={itemVariants}
                >
                  <FaDirections className="info-icon" />
                  <span>{point.transition}</span>
                </motion.div>
              )}

              {point.coordinates && (
                <motion.div 
                  className="point-map-link"
                  variants={itemVariants}
                >
                  <a 
                    href={`https://yandex.ru/maps/?pt=${point.coordinates[1]},${point.coordinates[0]}&z=17`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaMapMarkedAlt className="info-icon" />
                    Открыть на карте
                  </a>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {route.points.length > 1 && (
          <motion.div 
            className="view-full-route"
            variants={itemVariants}
          >
            <a 
              href={`https://yandex.ru/maps/?rtext=${route.points
                .map(point => point.coordinates.join(','))
                .join('~')}&rtt=pd`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-route-button"
            >
              <FaMapMarkedAlt className="button-icon" />
              Посмотреть весь маршрут на карте
            </a>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ArtRoutes; 