import audio from '@material-symbols/svg-400/rounded/audio_file.svg'
import code from '@material-symbols/svg-400/rounded/code.svg'
import document from '@material-symbols/svg-400/rounded/description.svg'
import folder from '@material-symbols/svg-400/rounded/folder.svg'
import archive from '@material-symbols/svg-400/rounded/folder_zip.svg'
import image from '@material-symbols/svg-400/rounded/image.svg'
import movie from '@material-symbols/svg-400/rounded/movie.svg'
export function FileIcon({ name, directory }: { name: string; directory: boolean }) {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  let source = document
  if (directory) source = folder
  else if (/^(png|jpe?g|webp|gif|avif|svg)$/.test(extension)) source = image
  else if (/^(mp4|mkv|webm|mov)$/.test(extension)) source = movie
  else if (/^(mp3|flac|wav|ogg|m4a)$/.test(extension)) source = audio
  else if (/^(zip|gz|tar|7z|rar)$/.test(extension)) source = archive
  else if (/^(go|tsx?|jsx?|json|yaml|css|html|sh|py|rs)$/.test(extension)) source = code
  return (
    <span
      aria-hidden="true"
      className="size-6 shrink-0 bg-current text-tertiary"
      style={{ maskImage: `url("${source}")`, maskSize: 'contain', maskRepeat: 'no-repeat' }}
    />
  )
}
