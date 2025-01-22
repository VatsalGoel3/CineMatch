import './Carousel.css'

export default function Carousel({ movies }) {
  return (
    <div className='carousel-wrapper'>
      <div className='carousel-container'>
        <div className='carousel-content'>
          {movies.map((movie) => (
            <div key={movie.id} className='carousel-card'>
              <img  
                src={movie.poster}
                alt={movie.title}
                className='carousel-card-poster'
              />
              <div className='carousel-card-overlay'>
                <h3>{movie.title}</h3>
                <p>{new Date(movie.release_date).getFullYear()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div> 
  );
}