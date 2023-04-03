import passportJWT from 'passport-jwt';
import passportConfig from '../../configs/passportConfig';
import UserSchema from '../schemas/UserSchema';

// passport & jwt config
const {
  Strategy: BearerStrategy,
  ExtractJwt: ExtractJWT,
} = passportJWT;

// define passport jwt strategy
const opts = {};
opts.jwtFromRequest = ExtractJWT.fromAuthHeaderWithScheme(passportConfig.JWT_TOKEN_PREFIX);
opts.secretOrKey = passportConfig.JWT_SECRET_OR_KEY;

const passportJWTStrategy = new BearerStrategy(opts, function(jwtPayload, done) {
  
// retrieve mail from jwt payload
const email = jwtPayload.user.email;

  // if mail exist in database then authentication succeed
  UserSchema.findOne({email: email}, (error, user) => {
    if (error) {
      return done(error, false);
    } else {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    }
  });
});

export default (passport) => {
  passport.use(passportJWTStrategy);

  return passport ;
}