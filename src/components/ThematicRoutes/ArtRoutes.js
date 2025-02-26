import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPalette, FaMapMarkerAlt, FaClock, FaSubway, FaInfoCircle, FaCamera, FaWalking, FaCoffee } from 'react-icons/fa';
import './ArtRoutes.css';

const ArtRoutes = () => {
  const [selectedRoute, setSelectedRoute] = useState(1);

  const routes = {
    1: {
      title: "Центр города — от «Гаража» до Патриков",
      description: "Классический маршрут по главным точкам современного искусства в центре",
      transport: "Начало у метро «Парк Культуры» (Кольцевая линия)",
      stages: [
        {
          name: "Музей современного искусства «Гараж»",
          address: "Парк Горького, Крымский Вал, 9",
          highlights: ["Выставки мировых художников", "Архив российского искусства"],
          tips: "Загляните в книжный магазин и кафе на территории",
          duration: "1,5 часа",
          image: "/images/garage-museum.jpg"
        },
        {
          name: "Уличные объекты в Парке Горького",
          highlights: ["Арт-инсталляции у главного входа", "«Дерево любви» у набережной"],
          tips: "Летом можно арендовать велосипед для перемещения",
          duration: "40 минут",
          image: "/images/gorky-park.jpg"
        },
        {
          name: "Галерея «Электрозавод»",
          address: "ул. Электрозаводская, 21",
          transport: "15 минут на такси от парка",
          highlights: ["Экспериментальные проекты", "Интерактивные выставки"],
          duration: "1 час",
          image: "/images/electrozavod.jpg"
        },
        {
          name: "Стрит-арт на Патриарших прудах",
          address: "Малый Козихинский переулок, Бол. Козихинский пер.",
          highlights: ["Граффити во дворах", "Работы Тимофея Ради"],
          finalStop: "Кафе «Март» на Патриарших для отдыха",
          duration: "45 минут",
          image: "/images/patriarchy.jpg"
        }
      ]
    },
    2: {
      title: "Арт-кластеры — «Винзавод» и «Хохловка»",
      description: "Промышленные зоны, превращенные в арт-пространства",
      transport: "м. «Курская», далее пешком до «Винзавода» (4-й Сыромятнический пер., 1)",
      stages: [
        {
          name: "ЦСИ «Винзавод»",
          address: "4-й Сыромятнический пер., 1",
          highlights: ["Галереи: «Третий этаж»", "«Frida Project Foundation»"],
          tips: "Проверьте расписание лекций и воркшопов",
          duration: "1,5 часа",
          image: "/images/vinzavod.jpg"
        },
        {
          name: "Арт-центр «Арма» (Хохловка)",
          address: "ул. Верхняя Радищевская",
          transport: "10 мин на такси от Винзавода",
          highlights: ["Муралы", "Граффити-зоны", "Индустриальные инсталляции"],
          duration: "1 час",
          image: "/images/arma.jpg"
        },
        {
          name: "Парк Art Play",
          address: "Нижняя Сыромятническая ул., 10",
          highlights: ["Сезонные выставки", "Мастерские художников"],
          finalStop: "Ресторан «Винзавод. Линия» с видом на арт-объекты",
          duration: "1 час",
          image: "/images/artplay.jpg"
        }
      ]
    },
    3: {
      title: "Красный Октябрь и Болотная набережная",
      description: "Современное искусство в историческом центре Москвы",
      transport: "м. «Кропоткинская», пешком к Болотной набережной",
      stages: [
        {
          name: "Галерея «Red October»",
          address: "Берсеневская наб., 6",
          highlights: ["Выставки молодых художников", "VR-инсталляции"],
          duration: "1,5 часа",
          image: "/images/red-october.jpg"
        },
        {
          name: "Стрит-арт на Берсеневской набережной",
          highlights: ["Граффити «Москва — не город» (автор: Покрас Лампас)"],
          duration: "30 минут",
          image: "/images/bersenevskaya.jpg"
        },
        {
          name: "Art Basement на «Флаконе»",
          address: "ул. Б. Новодмитровская, 36",
          transport: "15 мин на метро до «Дмитровской»",
          highlights: ["Подземные выставки", "Поп-ап маркеты"],
          finalStop: "Коворкинг «Кафемир» на «Флаконе» с кофе и десертами",
          duration: "2 часа",
          image: "/images/art-basement.jpg"
        }
      ]
    },
    4: {
      title: "ВДНХ и Ботанический сад",
      description: "Искусство в окружении природы и архитектуры",
      transport: "м. «ВДНХ»",
      stages: [
        {
          name: "Павильон «Космос» (ВДНХ)",
          highlights: ["Арт-инсталляции на тему технологий"],
          duration: "1,5 часа",
          image: "/images/cosmos.jpg"
        },
        {
          name: "Парк «Останкино»",
          highlights: ["Скульптуры «Дерево жизни»", "«Цветочный шар»"],
          duration: "1 час",
          image: "/images/ostankino.jpg"
        },
        {
          name: "Галерея «Ботаника»",
          address: "Ботанический сад МГУ",
          highlights: ["Экологическое искусство", "Выставки под открытым небом"],
          tips: "Возьмите пикник для отдыха в парке",
          duration: "2 часа",
          image: "/images/botanica.jpg"
        }
      ]
    },
    5: {
      title: "Новая Москва — Сити и Сколково",
      description: "Современное искусство в деловых районах столицы",
      transport: "м. «Деловой центр»",
      stages: [
        {
          name: "Башни Москва-Сити",
          highlights: ["Арт-объекты в зоне «Афимолл»", "«Вращающиеся сферы»"],
          duration: "1 час",
          image: "/images/moscow-city.jpg"
        },
        {
          name: "Галерея «Сколково»",
          address: "Инновационный центр",
          transport: "25 мин на такси",
          highlights: ["Выставки на стыке науки и искусства"],
          duration: "2 часа",
          image: "/images/skolkovo.jpg"
        },
        {
          name: "Стрит-арт в районе «Технопарк»",
          highlights: ["Муралы от международных художников"],
          finalStop: "Ресторан «Барвиха Lounge» с панорамным видом",
          duration: "1 час",
          image: "/images/technopark.jpg"
        }
      ]
    }
  };

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

  return (
    <motion.div 
      className="art-routes-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="route-selector">
        {Object.keys(routes).map((routeId) => (
          <button
            key={routeId}
            className={`route-selector-btn ${selectedRoute === parseInt(routeId) ? 'active' : ''}`}
            onClick={() => setSelectedRoute(parseInt(routeId))}
          >
            {routes[routeId].title}
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
          <h2>{routes[selectedRoute].title}</h2>
          <p className="route-description">{routes[selectedRoute].description}</p>
        </div>

        <motion.div 
          className="transport-info"
          variants={itemVariants}
        >
          <FaSubway className="info-icon" />
          <span>{routes[selectedRoute].transport}</span>
        </motion.div>

        <div className="stages-container">
          {routes[selectedRoute].stages.map((stage, index) => (
            <motion.div 
              key={index}
              className="stage-card"
              variants={itemVariants}
            >
              <div className="stage-header">
                <h3>
                  <FaMapMarkerAlt className="stage-icon" />
                  {stage.name}
                </h3>
                <span className="duration">
                  <FaClock className="time-icon" />
                  {stage.duration}
                </span>
              </div>

              {stage.address && (
                <motion.div 
                  className="stage-address"
                  variants={itemVariants}
                >
                  <FaMapMarkerAlt className="info-icon" />
                  {stage.address}
                </motion.div>
              )}

              {stage.transport && (
                <motion.div 
                  className="stage-transport"
                  variants={itemVariants}
                >
                  <FaWalking className="info-icon" />
                  {stage.transport}
                </motion.div>
              )}

              <motion.div 
                className="stage-highlights"
                variants={itemVariants}
              >
                {stage.highlights.map((highlight, i) => (
                  <motion.div 
                    key={i} 
                    className="highlight-item"
                    variants={itemVariants}
                  >
                    <FaCamera className="info-icon" />
                    {highlight}
                  </motion.div>
                ))}
              </motion.div>

              {stage.tips && (
                <motion.div 
                  className="stage-tip"
                  variants={itemVariants}
                >
                  <FaInfoCircle className="info-icon" />
                  {stage.tips}
                </motion.div>
              )}

              {stage.finalStop && (
                <motion.div 
                  className="final-stop"
                  variants={itemVariants}
                >
                  <FaCoffee className="info-icon" />
                  {stage.finalStop}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArtRoutes; 