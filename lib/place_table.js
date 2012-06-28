var place_table =
{
// type network addr and place name.
//  "xx\.xx\.xx\.": "1F",
};

module.exports.get_place_by_ip = function(ip){
  for ( var net_ip in place_table ){
    if ( ip.match(net_ip)){
      return place_table[net_ip];
    }
  }
  return "";
}

