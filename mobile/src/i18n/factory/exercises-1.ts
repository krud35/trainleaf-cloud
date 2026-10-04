import type { FactoryExerciseTexts } from './types';

/** French and Spanish factory texts. A shared cue or variant is written once, under the first exercise that uses it. */
export const exercises1: FactoryExerciseTexts = {
  squat: {
    fr: { name: 'Squat goblet', cues: 'Tenez la charge près de la poitrine, descendez entre les hanches et remontez en poussant sur tout le pied.', variants: 'Une pause travaille la position basse ; la charge devant aide à exercer l’équilibre et le contrôle du squat.' },
    es: { name: 'Sentadilla goblet', cues: 'Sujeta el peso cerca del pecho, baja entre las caderas y sube apoyando todo el pie.', variants: 'Una pausa trabaja la posición baja; la carga por delante ayuda a practicar el equilibrio y el control de la sentadilla.' },
  },
  rdl: {
    fr: { name: 'Soulevé de terre roumain', cues: 'Reculez les hanches, genoux souples. Gardez la charge près des jambes et arrêtez-vous avant que le contrôle du tronc ne change.', variants: 'Une descente plus lente développe le contrôle ; l’amplitude dépend de la charnière de hanche, non du besoin de toucher le sol.' },
    es: { name: 'Peso muerto rumano', cues: 'Lleva las caderas atrás con las rodillas ligeramente flexionadas. Mantén la carga cerca de las piernas y detente antes de que cambie el control del tronco.', variants: 'Una bajada más lenta desarrolla el control; la amplitud depende de la bisagra de cadera, no de la necesidad de tocar el suelo.' },
  },
  lunge: {
    fr: { name: 'Fente arrière', cues: 'Reculez un pied avec contrôle et revenez en poussant sur le pied avant. Laissez le genou suivre les orteils.', variants: 'Un pas plus long modifie la sollicitation des hanches ; un pas plus court modifie la flexion du genou. La longueur du pas n’isole pas un muscle.' },
    es: { name: 'Zancada atrás', cues: 'Da un paso atrás con control y vuelve empujando con el pie delantero. Deja que la rodilla siga la línea de los dedos.', variants: 'Un paso más largo cambia la exigencia de la cadera; uno más corto cambia la flexión de la rodilla. La longitud del paso no aísla un músculo.' },
  },
  lateral: {
    fr: { name: 'Fente latérale', cues: 'Amenez les hanches au-dessus de la jambe d’appui, pied à plat. Allongez l’autre jambe sans affaisser le tronc.', variants: 'Une amplitude plus réduite aide le contrôle ; un pas plus long augmente les exigences dans le plan latéral.' },
    es: { name: 'Zancada lateral', cues: 'Lleva las caderas sobre la pierna que trabaja con el pie apoyado. Estira la otra pierna sin hundir el tronco.', variants: 'Una amplitud menor ayuda al control; un paso más largo aumenta la exigencia en el plano lateral.' },
  },
  calf: {
    fr: { name: 'Extension des mollets', cues: 'Montez les talons sans vous balancer et redescendez avec contrôle. Gardez l’avant-pied stable.', variants: 'Genou tendu, l’accent porte davantage sur les gastrocnémiens ; genou fléchi, il se déplace vers le soléaire.' },
    es: { name: 'Elevación de talones', cues: 'Sube los talones sin balancearte y baja con control. Mantén estable la parte delantera del pie.', variants: 'Con la rodilla extendida se acentúa más el gastrocnemio; con la rodilla flexionada el énfasis pasa al sóleo.' },
  },
  pushup: {
    fr: { name: 'Pompes', cues: 'Gardez le tronc aligné et déplacez le corps d’un seul bloc. Choisissez un placement des mains qui permet un mouvement confortable des épaules.', variants: 'Surélever les mains réduit la résistance ; surélever les pieds modifie la sollicitation des épaules.' },
    es: { name: 'Flexiones', cues: 'Mantén el tronco alineado y mueve el cuerpo en bloque. Elige una posición de manos que permita un movimiento cómodo de los hombros.', variants: 'Elevar las manos reduce la resistencia; elevar los pies cambia la exigencia de los hombros.' },
  },
  row: {
    fr: { name: 'Rowing haltère à un bras', cues: 'Prenez appui avec le tronc, tirez par le coude et évitez de tourner tout le corps pour prendre de l’élan.', variants: 'Supprimer l’appui augmente les exigences de contrôle du tronc ; tirer vers la hanche ou vers la poitrine change l’accent.' },
    es: { name: 'Remo con mancuerna a una mano', cues: 'Apoya el tronco, tira desde el codo y evita girar todo el cuerpo para ganar impulso.', variants: 'Quitar el apoyo aumenta la exigencia de control del tronco; tirar hacia la cadera o hacia el pecho cambia el énfasis.' },
  },
  press: {
    fr: { name: 'Développé au-dessus de la tête', cues: 'Gainez-vous et poussez sans vous cambrer au niveau des lombaires. Laissez les omoplates accompagner les bras.', variants: 'Le développé assis réduit la participation des jambes ; le travail à un bras augmente les exigences de contrôle latéral du tronc.' },
    es: { name: 'Press por encima de la cabeza', cues: 'Activa el tronco y empuja sin arquear la zona lumbar. Deja que las escápulas acompañen a los brazos.', variants: 'El press sentado reduce la participación de las piernas; el trabajo a una mano aumenta la exigencia de control lateral del tronco.' },
  },
  easy: {
    fr: { name: 'Course continue facile', cues: 'Choisissez une allure facile et une foulée naturelle. Notez la durée ou la distance et l’effort perçu.', variants: 'Les intervalles course–marche aident à la reprise ; de courtes récupérations transforment le travail continu en intervalles.' },
    es: { name: 'Carrera continua suave', cues: 'Elige un ritmo suave y una zancada natural. Anota el tiempo o la distancia y el esfuerzo percibido.', variants: 'Los intervalos de carrera y marcha ayudan a quienes vuelven a entrenar; las pausas breves convierten el trabajo continuo en intervalos.' },
  },
  accel: {
    fr: { name: 'Accélérations en ligne droite', cues: 'Poussez le sol vers l’arrière et redressez-vous progressivement. Terminez par un freinage contrôlé.', variants: 'Les départs courts mettent l’accent sur l’accélération ; les courses plus longues permettent une vitesse plus élevée.' },
    es: { name: 'Aceleraciones en línea recta', cues: 'Empuja el suelo hacia atrás y ve incorporándote poco a poco. Termina con una frenada controlada.', variants: 'Las salidas cortas acentúan la aceleración; las carreras más largas permiten mayor velocidad.' },
  },
  shuttle: {
    fr: { name: 'Course navette', cues: 'Freinez avant la ligne et repoussez-vous après le demi-tour. Travaillez les deux côtés de rotation.', variants: 'Des navettes plus courtes ajoutent des demi-tours ; des navettes plus longues ajoutent des portions de course plus rapides.' },
    es: { name: 'Carrera de ida y vuelta', cues: 'Frena antes de la línea e impúlsate tras el giro. Practica el giro hacia ambos lados.', variants: 'Los recorridos más cortos añaden giros; los más largos añaden tramos de carrera más rápidos.' },
  },
  cut: {
    fr: { name: 'Changement de direction', cues: 'Abaissez-vous pendant le freinage et orientez la poussée suivante vers la nouvelle cible.', variants: 'Un changement de direction planifié entraîne le mouvement ; un signal donné par un partenaire ajoute perception et prise de décision.' },
    es: { name: 'Cambio de dirección', cues: 'Baja el cuerpo al frenar y dirige el siguiente impulso hacia el nuevo objetivo.', variants: 'Un cambio planificado entrena el movimiento; una señal de un compañero añade percepción y toma de decisiones.' },
  },
  shuffle: {
    fr: { name: 'Pas chassés', cues: 'Contrôlez les hanches et poussez latéralement. Adaptez les pas à la vitesse de la tâche.', variants: 'Réagir à un partenaire ajoute des décisions ; les pas croisés offrent une autre option sur de plus longues distances.' },
    es: { name: 'Desplazamiento lateral', cues: 'Controla las caderas y empuja hacia un lado. Ajusta los pasos a la velocidad de la tarea.', variants: 'Reaccionar a un compañero añade decisiones; los pasos cruzados son otra opción para distancias más largas.' },
  },
  rope: {
    fr: { name: 'Corde à sauter', cues: 'Sautez bas et en rythme, avec des réceptions contrôlées et les épaules détendues.', variants: 'Le travail sur une jambe augmente les exigences pour chaque jambe ; des blocs continus plus longs déplacent l’accent vers la condition physique.' },
    es: { name: 'Comba', cues: 'Salta bajo y con ritmo, con aterrizajes controlados y los hombros relajados.', variants: 'El trabajo a una pierna aumenta la exigencia de cada pierna; los bloques continuos más largos desplazan el énfasis hacia el acondicionamiento.' },
  },
  plank: {
    fr: { name: 'Planche sur les avant-bras', cues: 'Gardez les côtes au-dessus du bassin et respirez en maintenant la position.', variants: 'Surélever les mains facilite l’exercice ; un bras de levier plus long augmente les exigences d’anti-extension.' },
    es: { name: 'Plancha sobre antebrazos', cues: 'Mantén las costillas sobre la pelvis y respira manteniendo la posición.', variants: 'Elevar las manos ayuda; una palanca más larga aumenta la exigencia de antiextensión.' },
  },
  sideplank: {
    fr: { name: 'Planche latérale', cues: 'Placez le coude sous l’épaule et maintenez le bassin sans le laisser descendre ni tourner.', variants: 'L’appui sur le genou raccourcit le bras de levier ; lever la jambe du dessus ajoute un travail des abducteurs de la hanche.' },
    es: { name: 'Plancha lateral', cues: 'Coloca el codo bajo el hombro y mantén la pelvis sin que caiga ni gire.', variants: 'Apoyar la rodilla acorta la palanca; levantar la pierna de arriba añade trabajo de los abductores de la cadera.' },
  },
  bike: {
    fr: { name: 'Vélo stationnaire', cues: 'Réglez la selle pour un mouvement confortable du genou et pédalez de façon fluide. Notez la durée, la résistance et le RPE.', variants: 'Une résistance plus élevée modifie la force demandée au pédalage ; les intervalles et le pédalage continu servent des objectifs de séance différents.' },
    es: { name: 'Bicicleta estática', cues: 'Ajusta el sillín para un movimiento cómodo de la rodilla y pedalea con fluidez. Anota la duración, la resistencia y el RPE.', variants: 'Una resistencia mayor cambia la fuerza de pedaleo; los intervalos y el pedaleo continuo sirven a objetivos de sesión distintos.' },
  },
  walk: { fr: { name: 'Marche tranquille' }, es: { name: 'Caminata suave' } },
  'catalog-back-squat': {
    fr: { name: 'Squat barre sur le dos', cues: 'Gainez le tronc, gardez tout le pied au sol et laissez les genoux suivre les orteils.', variants: 'La charge devant modifie les exigences d’équilibre ; une pause développe le contrôle. Choisissez une profondeur adaptée.' },
    es: { name: 'Sentadilla trasera con barra', cues: 'Activa el tronco, mantén todo el pie apoyado y deja que las rodillas sigan la línea de los dedos.', variants: 'La carga por delante cambia la exigencia de equilibrio; una pausa desarrolla el control. Elige una profundidad adecuada.' },
  },
  'catalog-half-squat': {
    fr: { name: 'Demi-squat', cues: 'Descendez jusqu’à la demi-profondeur choisie et gardez la même amplitude à chaque répétition.', variants: 'Une amplitude limitée entraîne la force dans des positions choisies. Un squat plus profond est une variante distincte ; comparez les résultats à la même profondeur.' },
    es: { name: 'Media sentadilla', cues: 'Baja hasta la media profundidad elegida y usa la misma amplitud en cada repetición.', variants: 'Una amplitud limitada entrena la fuerza en posiciones concretas. Una sentadilla más profunda es otra variante; compara los resultados a la misma profundidad.' },
  },
  'catalog-quarter-box-squat': {
    fr: { name: 'Quart de squat sur box', cues: 'Reculez les hanches jusqu’à un box haut, puis revenez debout. Le box fixe l’amplitude du mouvement.', variants: 'La hauteur du box définit l’amplitude courte. Une pause sur le box et un simple contact n’ont pas les mêmes exigences ; gardez la même variante pour comparer les charges.' },
    es: { name: 'Cuarto de sentadilla al cajón', cues: 'Lleva las caderas atrás hasta un cajón alto y vuelve a ponerte de pie. El cajón fija la amplitud del movimiento.', variants: 'La altura del cajón define la amplitud corta. Una pausa en el cajón y un toque ligero tienen exigencias distintas; usa la misma variante al comparar cargas.' },
  },
  'catalog-dumbbell-goblet-squat': {
    fr: { name: 'Squat goblet avec haltère', cues: 'Tenez un haltère contre la poitrine, fléchissez les hanches et les genoux, puis remontez.' },
    es: { name: 'Sentadilla goblet con mancuerna', cues: 'Sujeta una mancuerna junto al pecho, flexiona caderas y rodillas y vuelve a subir.' },
  },
  'catalog-bulgarian-split-squat': {
    fr: { name: 'Squat bulgare', cues: 'Ancrez le pied avant et descendez sans tourner le bassin. La jambe arrière aide à tenir la position.', variants: 'Une légère inclinaison vers l’avant peut augmenter la sollicitation des hanches ; un tronc plus droit change l’accent. Un appui aide l’équilibre.' },
    es: { name: 'Sentadilla búlgara', cues: 'Apoya bien el pie delantero y baja sin girar la pelvis. La pierna de atrás ayuda a mantener la posición.', variants: 'Una ligera inclinación hacia delante puede aumentar la exigencia de la cadera; un tronco más erguido cambia el énfasis. Un apoyo ayuda al equilibrio.' },
  },
  'catalog-barbell-bulgarian-split-squat': {
    fr: { name: 'Squat bulgare à la barre', cues: 'Réalisez un squat bulgare avec une barre. Notez le total des répétitions des deux côtés.' },
    es: { name: 'Sentadilla búlgara con barra', cues: 'Haz una sentadilla búlgara con barra. Anota el total de repeticiones de ambos lados.' },
  },
  'catalog-dumbbell-split-squat': {
    fr: { name: 'Squat en fente avec haltères', cues: 'Descendez et remontez en position de fente, haltères le long du corps.' },
    es: { name: 'Sentadilla en zancada con mancuernas', cues: 'Baja y sube el cuerpo en posición de zancada con las mancuernas a los lados.' },
  },
  'catalog-barbell-forward-lunge': {
    fr: { name: 'Fente avant à la barre', cues: 'Faites un pas en avant, fléchissez les deux jambes et revenez à la position de départ.' },
    es: { name: 'Zancada adelante con barra', cues: 'Da un paso adelante, flexiona ambas piernas y vuelve a la posición inicial.' },
  },
  'catalog-dumbbell-forward-to-reverse-lunge': {
    fr: { name: 'Fente avant puis arrière avec haltères', cues: 'Enchaînez une fente avant et une fente arrière sur la même jambe. Définissez comment vous comptez la séquence complète.' },
    es: { name: 'Zancada adelante y atrás con mancuernas', cues: 'Combina una zancada adelante y una atrás con la misma pierna. Define cómo cuentas la secuencia completa.' },
  },
  'catalog-single-leg-landmine-squat': {
    fr: { name: 'Squat sur une jambe au landmine', cues: 'Tenez l’extrémité libre de la barre landmine contre la poitrine et réalisez un squat sur une jambe.', variants: 'Le landmine offre un appui et une trajectoire de charge différente. Moins d’appui augmente les exigences d’équilibre, sans forcément augmenter le stimulus de force.' },
    es: { name: 'Sentadilla a una pierna con landmine', cues: 'Sujeta el extremo libre de la barra landmine junto al pecho y haz una sentadilla a una pierna.', variants: 'El landmine ofrece apoyo y otra trayectoria de la carga. Menos apoyo aumenta la exigencia de equilibrio; no aumenta necesariamente el estímulo de fuerza.' },
  },
  'catalog-conventional-deadlift': {
    fr: { name: 'Soulevé de terre classique', cues: 'Placez la charge près des pieds, gainez-vous et repoussez le sol. Les hanches et les épaules montent ensemble.', variants: 'Surélever la charge raccourcit l’amplitude ; la variante roumaine met l’accent sur la charnière de hanche.' },
    es: { name: 'Peso muerto convencional', cues: 'Coloca la carga cerca de los pies, activa el tronco y empuja el suelo. Las caderas y los hombros suben a la vez.', variants: 'Elevar la carga acorta la amplitud; la variante rumana acentúa la bisagra de cadera.' },
  },
  'catalog-trap-bar-deadlift': {
    fr: { name: 'Soulevé de terre à la trap bar', cues: 'Placez-vous au centre, gainez-vous et montez sans à-coup ni cambrure arrière.', variants: 'Les poignées hautes raccourcissent l’amplitude. Une flexion plus marquée des genoux modifie l’équilibre entre le mouvement du genou et celui de la hanche.' },
    es: { name: 'Peso muerto con barra hexagonal', cues: 'Colócate en el centro, activa el tronco y sube sin tirones ni inclinarte hacia atrás.', variants: 'Los agarres altos acortan la amplitud. Una mayor flexión de rodillas cambia el equilibrio entre el movimiento de rodilla y de cadera.' },
  },
  'catalog-kettlebell-deadlift': {
    fr: { name: 'Soulevé de terre avec kettlebell', cues: 'Soulevez une kettlebell placée entre vos pieds en étendant les hanches et les genoux.' },
    es: { name: 'Peso muerto con kettlebell', cues: 'Levanta una kettlebell situada entre los pies extendiendo caderas y rodillas.' },
  },
  'catalog-single-leg-deadlift': {
    fr: { name: 'Soulevé de terre sur une jambe', cues: 'Fléchissez à la hanche d’appui et inclinez-vous vers l’avant pendant que l’autre jambe part vers l’arrière.', variants: 'Un appui de la main réduit les exigences d’équilibre ; une position avec appui léger du pied arrière permet de mieux cibler la force de la hanche.' },
    es: { name: 'Peso muerto a una pierna', cues: 'Flexiona la cadera de apoyo e inclínate hacia delante mientras la otra pierna se va hacia atrás.', variants: 'Apoyar la mano reduce la exigencia de equilibrio; una postura con apoyo ligero del pie de atrás facilita acentuar la fuerza de la cadera.' },
  },
  'catalog-dumbbell-single-leg-deadlift': {
    fr: { name: 'Soulevé de terre sur une jambe avec haltères', cues: 'Réalisez une charnière de hanche sur une jambe avec des haltères. Notez leur poids total.' },
    es: { name: 'Peso muerto a una pierna con mancuernas', cues: 'Haz una bisagra de cadera a una pierna con mancuernas. Anota su peso total.' },
  },
  'catalog-barbell-single-leg-deadlift': {
    fr: { name: 'Soulevé de terre sur une jambe à la barre', cues: 'Réalisez une charnière de hanche sur une jambe, la barre près de la jambe d’appui.' },
    es: { name: 'Peso muerto a una pierna con barra', cues: 'Haz una bisagra de cadera a una pierna con la barra cerca de la pierna de apoyo.' },
  },
  'catalog-hip-thrust': {
    fr: { name: 'Hip thrust', cues: 'Étendez les hanches sans cambrer le bas du dos. Terminez avec les côtes et le bassin sous contrôle.', variants: 'Un pont au sol raccourcit l’amplitude ; la version sur une jambe ajoute des exigences de contrôle du bassin.' },
    es: { name: 'Hip thrust', cues: 'Extiende las caderas sin arquear la zona lumbar. Termina con las costillas y la pelvis bajo control.', variants: 'Un puente en el suelo acorta la amplitud; la versión a una pierna añade exigencia de control de la pelvis.' },
  },
  'catalog-single-leg-barbell-hip-thrust': {
    fr: { name: 'Hip thrust sur une jambe à la barre', cues: 'Montez les hanches avec un pied au sol et la barre posée sur les hanches.' },
    es: { name: 'Hip thrust a una pierna con barra', cues: 'Sube las caderas con un pie en el suelo y la barra apoyada sobre las caderas.' },
  },
  'catalog-banded-single-leg-hip-thrust': {
    fr: { name: 'Hip thrust sur une jambe avec élastique', cues: 'Montez les hanches sur une jambe contre un élastique. Notez les répétitions des deux côtés.' },
    es: { name: 'Hip thrust a una pierna con goma', cues: 'Sube las caderas a una pierna contra una goma elástica. Anota las repeticiones de ambos lados.' },
  },
  'catalog-hamstring-leg-curl': {
    fr: { name: 'Leg curl ischio-jambiers', cues: 'Fléchissez les genoux contre la résistance de la machine, puis revenez à la position de départ.', variants: 'La version assise modifie la position de la hanche ; le travail sur une jambe permet de suivre chaque côté séparément.' },
    es: { name: 'Curl de isquiotibiales', cues: 'Flexiona las rodillas contra la resistencia de la máquina y vuelve a la posición inicial.', variants: 'La versión sentada cambia la posición de la cadera; el trabajo a una pierna permite seguir cada lado por separado.' },
  },
  'catalog-stability-ball-leg-curl': {
    fr: { name: 'Leg curl sur ballon de stabilité', cues: 'Placez les talons sur un ballon de stabilité et ramenez-le vers vous en gardant les hanches relevées.', variants: 'Un pont avec flexion des genoux ajoute une extension de hanche maintenue. Le travail sur une jambe augmente les exigences pour chaque jambe et le contrôle du bassin.' },
    es: { name: 'Curl de piernas con fitball', cues: 'Apoya los talones en un fitball y acércalo manteniendo las caderas elevadas.', variants: 'Un puente con flexión de rodillas añade una extensión de cadera mantenida. El trabajo a una pierna aumenta la exigencia de cada pierna y el control de la pelvis.' },
  },
  'catalog-band-assisted-nordic-curl': {
    fr: { name: 'Curl nordique assisté par élastique', cues: 'Depuis la position à genoux, pieds bloqués, penchez-vous vers l’avant. L’élastique assiste le mouvement.', variants: 'Un élastique ou une amplitude réduite aide à contrôler la descente. Introduisez le volume progressivement.' },
    es: { name: 'Curl nórdico asistido con goma', cues: 'De rodillas y con los pies sujetos, inclínate hacia delante. La goma asiste el movimiento.', variants: 'Una goma o una amplitud menor ayudan a controlar la bajada. Introduce el volumen de forma gradual.' },
  },
  'catalog-machine-knee-extension': {
    fr: { name: 'Extension des genoux à la machine', cues: 'Étendez les genoux contre la résistance de la machine et revenez à la position fléchie.', variants: 'Le travail sur une jambe permet de suivre chaque côté. Le choix de l’amplitude modifie les positions du genou travaillées ; gardez le contrôle et réglez la machine.' },
    es: { name: 'Extensión de rodillas en máquina', cues: 'Extiende las rodillas contra la resistencia de la máquina y vuelve a la posición flexionada.', variants: 'El trabajo a una pierna permite seguir cada lado. La amplitud elegida cambia las posiciones de rodilla entrenadas; mantén el control y ajusta la máquina.' },
  },
  'catalog-machine-hip-adduction': {
    fr: { name: 'Adduction des hanches à la machine', cues: 'Rapprochez les cuisses contre la résistance de la machine, puis revenez à la position de départ.', variants: 'L’adduction entraîne directement le mouvement de la cuisse vers l’intérieur. La position de la hanche et l’amplitude modifient la tâche ; un squat ne la remplace pas sur toutes les amplitudes.' },
    es: { name: 'Aducción de cadera en máquina', cues: 'Junta los muslos contra la resistencia de la máquina y vuelve a la posición inicial.', variants: 'La aducción entrena directamente el movimiento del muslo hacia dentro. La posición de la cadera y la amplitud cambian la tarea; una sentadilla no la sustituye en todas las amplitudes.' },
  },
};
