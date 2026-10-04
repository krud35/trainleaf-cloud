// Demonstration only. Saved example entries are never recommendations.
export const exercises=[
 {id:'goblet',name:'Przysiad goblet',kind:'Siła',modality:'strength',unit:'powt.',muscles:['Nogi','Pośladki'],description:'Przysiad z obciążeniem trzymanym przed klatką piersiową.'},
 {id:'rdl',name:'Martwy ciąg rumuński',kind:'Siła',modality:'strength',unit:'powt.',muscles:['Tył uda','Pośladki'],description:'Ruch zawiasowy w biodrach z obciążeniem prowadzonym blisko nóg.'},
 {id:'run',name:'Spokojny bieg',kind:'Wytrzymałość',modality:'running',unit:'min',muscles:['Nogi'],description:'Bieg ciągły. Tempo zapisujesz jako czas pokonania kilometra.'},
 {id:'backhand',name:'Backhand w parach',kind:'Technika',modality:'skill',unit:'rzuty',muscles:[],description:'Rzuty backhand wykonywane między dwiema osobami.'},
 {id:'hips',name:'Mobilizacja bioder',kind:'Mobilność',modality:'mobility',unit:'min',muscles:['Biodra'],description:'Ćwiczenie zakresu ruchu bioder. Wariant zapisujesz we własnej notatce.'},
 {id:'row',name:'Wiosłowanie hantlem w podparciu',kind:'Siła',modality:'strength',unit:'powt.',muscles:['Plecy','Ramiona'],description:'Przyciąganie hantla jednorącz przy podpartym tułowiu.'},
 {id:'cycle',name:'Jazda na rowerze',kind:'Wytrzymałość',modality:'cycling',unit:'min',muscles:['Nogi'],description:'Trening na rowerze. Tempo biegu w min/km nie dotyczy tego ćwiczenia.'},
 {id:'mental',name:'Wizualizacja przed startem',kind:'Mentalny',modality:'mental',unit:'min',muscles:[],description:'Zapis własnej sesji przygotowania mentalnego.'}
];
export const sports=['Ultimate frisbee','Bieganie','Trening siłowy','Kolarstwo','Pływanie','Inny sport'];
export const seed={
 workouts:[
 {id:'a',title:'Siła całego ciała',trainingType:'strength',sport:'Trening siłowy',date:'2026-10-02',time:'18:00',duration:'55',rpe:'6',notes:'Spokojne tempo. Następnym razem zostawić więcej czasu na rozgrzewkę.',status:'completed',exercises:[{...exercises[0],id:'a-ex1',sets:3,quantity:8,kg:16,rir:'2',section:'main'}],postSession:{aerobic:'4',muscular:'6',satisfaction:'8',notes:'Dobry trening.'}},
 {id:'b',title:'Spokojny bieg',trainingType:'running',sport:'Bieganie',date:'2026-09-30',time:'07:30',duration:'35',rpe:'3',notes:'Równe tempo.',status:'completed',exercises:[]},
 {id:'c',title:'Rzuty i praca nóg',trainingType:'technique',sport:'Ultimate frisbee',date:'2026-10-03',time:'11:00',duration:'45',rpe:'',notes:'Skupić się na dokładności podań.',status:'planned',exercises:[{...exercises[3],id:'c-ex1',sets:'3',quantity:'20',section:'main'}]},
 {id:'d',title:'Nogi i plecy',trainingType:'strength',sport:'Trening siłowy',date:'2026-10-04',time:'10:00',duration:'50',rpe:'',notes:'',status:'planned',exercises:[{...exercises[0],id:'d-ex1',sets:'',quantity:'',rir:'',section:'main'},{...exercises[5],id:'d-ex2',sets:'',quantity:'',rir:'',section:'main'}]},
 {id:'e',title:'Trening drużyny',trainingType:'team',sport:'Ultimate frisbee',date:'2026-10-01',time:'19:00',duration:'80',rpe:'',notes:'Plan bez zapisanego wykonania.',status:'planned',exercises:[]},
 {id:'f',title:'Rower',trainingType:'endurance',sport:'Kolarstwo',date:'2026-09-29',time:'',duration:'40',rpe:'',notes:'',status:'planned',exercises:[{...exercises[6],id:'f-ex1',sets:'',quantity:'',section:'main'}]},
 {id:'g',title:'Przygotowanie mentalne',trainingType:'mental',sport:'Ultimate frisbee',date:'2026-10-05',time:'20:00',duration:'15',rpe:'',notes:'',status:'planned',exercises:[]}
 ],
 periods:[
 {id:'season',name:'Przygotowania jesienne',start:'2026-09-01',end:'2026-11-30',phase:'Sezon',goal:'Regularny rytm treningów.',parentId:null},
 {id:'return',name:'Powrót do regularności',start:'2026-09-28',end:'2026-10-25',phase:'Przygotowanie ogólne',goal:'Spokojnie wrócić do 3 treningów w tygodniu.',parentId:'season'}
 ],
 profile:{sports:['Ultimate frisbee','Bieganie','Trening siłowy'],modules:['library','templates','history','wellness','export']},wellness:null
};
