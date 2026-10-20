interface MemeGifDisplayProps {
    url?: string;
    label: string;
}

export default function MemeGifDisplay({ url, label }: MemeGifDisplayProps) {
    if (!url) return null;
    const isGiphyEmbed = /^https:\/\/giphy\.com\/embed\//i.test(url);

    return (
        <figure className="detail-meme-preview">
            {isGiphyEmbed ? (
                <iframe src={url} title={`${label} meme GIF from GIPHY`} allowFullScreen loading="lazy" />
            ) : (
                <img src={url} alt={`${label} meme GIF`} loading="lazy" />
            )}
            {isGiphyEmbed && <figcaption><a href="https://giphy.com" target="_blank" rel="noreferrer">GIPHY</a></figcaption>}
        </figure>
    );
}
