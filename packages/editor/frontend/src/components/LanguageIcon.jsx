import { IoLogoJavascript } from 'react-icons/io5'
import { BiLogoTypescript } from 'react-icons/bi'
import { AiFillFileUnknown } from "react-icons/ai";
import { IconContext } from 'react-icons';

const icons = {
    'javascript': <IoLogoJavascript />,
    'typescript': <BiLogoTypescript />,
    'default': <AiFillFileUnknown />
}

const iconOptions = {
    'javascript': { color: 'yellow' },
    'typescript': { color: '#4196ff' },
    'default': {color: 'gray' }
}

export const LanguageIcon = ({ language, options }) => {
    return <IconContext.Provider value={ {...iconOptions[language], ...options} }>
        {icons[language] ?? icons['default']}
    </IconContext.Provider>
}